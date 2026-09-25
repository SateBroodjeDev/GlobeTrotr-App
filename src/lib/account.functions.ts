import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminClient = {
  from: (table: string) => any;
  storage: { from: (bucket: string) => any };
  auth: { admin: { getUserById: (id: string) => Promise<any>; deleteUser: (id: string) => Promise<any> } };
};

const EXPORT_TABLES = [
  "profiles",
  "workspaces",
  "trips",
  "trip_stops",
  "trip_itinerary_items",
  "trip_expenses",
  "trip_travel_items",
  "trip_packing_items",
  "trip_members",
  "trip_documents",
  "trip_journal_entries",
  "trip_invitations",
  "trip_tasks",
  "favorite_places",
  "notifications",
] as const;

async function selectAccountRows(db: AdminClient, table: string, userId: string, email?: string) {
  if (table === "profiles") return db.from(table).select("*").eq("id", userId);
  if (table === "workspaces" || table === "notifications" || table === "favorite_places") {
    return db.from(table).select("*").eq("user_id", userId);
  }
  if (table === "trips" || table.startsWith("trip_")) {
    if (table === "trip_tasks") {
      const ownedTrips = await db.from("trips").select("trip_uuid").eq("workspace_user_id", userId);
      if (ownedTrips.error || !ownedTrips.data?.length) return ownedTrips.error ? ownedTrips : { data: [], error: null };
      return db.from(table).select("*").in("trip_uuid", ownedTrips.data.map((trip: any) => trip.trip_uuid));
    }
    if (table === "trip_members") {
      return db.from(table).select("*").or(`workspace_user_id.eq.${userId},user_id.eq.${userId}`);
    }
    if (table === "trip_invitations") {
      const authored = await db.from(table).select("*").eq("invited_by", userId);
      if (authored.error || !email) return authored;
      const received = await db.from(table).select("*").ilike("email", email);
      if (received.error) return received;
      const rows = [...(authored.data ?? []), ...(received.data ?? [])];
      return { data: [...new Map(rows.map((row: any) => [row.id, row])).values()], error: null };
    }
    return db.from(table).select("*").eq("workspace_user_id", userId);
  }
  throw new Error("Onbekende exporttabel.");
}

function redactCredentials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactCredentials);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["share_pin_hash", "sharePinHash", "public_token"].includes(key))
      .map(([key, nested]) => [key, redactCredentials(nested)]),
  );
}

async function removeUserFiles(db: AdminClient, bucket: string, userId: string) {
  const storage = db.storage.from(bucket);
  const paths: string[] = [];
  async function visit(prefix: string) {
    let offset = 0;
    while (true) {
      const { data, error } = await storage.list(prefix, { limit: 100, offset });
      if (error) throw error;
      const entries = data ?? [];
      for (const entry of entries) {
        const path = `${prefix}/${entry.name}`;
        if (entry.id) paths.push(path);
        else await visit(path);
      }
      if (entries.length < 100) break;
      offset += entries.length;
    }
  }
  await visit(userId);
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await storage.remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
}

export const exportAccountData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as AdminClient;
    const { data: authData, error: authError } = await db.auth.admin.getUserById(context.userId);
    if (authError) throw authError;

    const entries = await Promise.all(
      EXPORT_TABLES.map(async (table) => {
        const { data, error } = await selectAccountRows(db, table, context.userId, authData.user?.email);
        if (error) throw error;
        return [table, data ?? []] as const;
      }),
    );
    const authUser = authData.user;
    const exportedData = Object.fromEntries(entries) as Record<string, any[]>;
    const notifications = exportedData.notifications ?? [];
    const dismissedNotifications = notifications.filter((row) => row.dismissed_at);
    exportedData.notifications = notifications.filter((row) => !row.dismissed_at);
    const dismissedByKind = dismissedNotifications.reduce<Record<string, number>>((summary, row) => {
      const kind = String(row.kind || "other");
      summary[kind] = (summary[kind] ?? 0) + 1;
      return summary;
    }, {});
    const result = {
      format: "GlobeTrotr account export",
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      account: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            phone: authUser.phone,
            createdAt: authUser.created_at,
            lastSignInAt: authUser.last_sign_in_at,
            appMetadata: authUser.app_metadata,
            userMetadata: authUser.user_metadata,
            identities: authUser.identities?.map((identity: any) => ({
              provider: identity.provider,
              createdAt: identity.created_at,
            })),
          }
        : null,
      data: redactCredentials(exportedData),
      dismissedNotificationSummary: {
        count: dismissedNotifications.length,
        byKind: dismissedByKind,
        note: "Dismissed interface notifications are aggregated to keep the portable JSON export compact.",
      },
      files: {
        note: "Uploaded files are not embedded. Their metadata and storage paths are included in the exported records.",
      },
    };
    const { error: notificationError } = await db.from("notifications").upsert(
      {
        user_id: context.userId,
        kind: "account",
        title: "Gegevensexport gereed / Data export ready",
        body: "export|ready",
        event_key: "account-export",
        created_at: new Date().toISOString(),
        dismissed_at: null,
      },
      { onConflict: "user_id,event_key" },
    );
    if (notificationError) throw notificationError;
    return result;
  });

export const recordAccountSecurityEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { event: "email_change_requested" | "password_changed" }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as AdminClient;
    const message = data.event === "password_changed"
      ? {
          title: "Wachtwoord gewijzigd / Password changed",
          body: "password_changed|security",
          eventKey: "account-security:password",
        }
      : {
          title: "Wijziging e-mailadres aangevraagd / Email change requested",
          body: "email_change_requested|security",
          eventKey: "account-security:email",
        };
    const { error } = await db.from("notifications").upsert({
      user_id: context.userId,
      kind: "account",
      title: message.title,
      body: message.body,
      event_key: message.eventKey,
      created_at: new Date().toISOString(),
      dismissed_at: null,
    }, { onConflict: "user_id,event_key" });
    if (error) throw error;
    return { recorded: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { confirmation: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.confirmation !== "DELETE") throw new Error("ACCOUNT_DELETE_CONFIRMATION_INVALID");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as AdminClient;
    const { data: authData, error: userError } = await db.auth.admin.getUserById(context.userId);
    if (userError) throw userError;
    await removeUserFiles(db, "avatars", context.userId);
    await removeUserFiles(db, "receipts", context.userId);
    const { error: membershipError } = await db.from("trip_members").delete().eq("user_id", context.userId);
    if (membershipError) throw membershipError;
    if (authData.user?.email) {
      const { error: invitationError } = await db
        .from("trip_invitations")
        .delete()
        .ilike("email", authData.user.email);
      if (invitationError) throw invitationError;
    }
    const { error } = await db.auth.admin.deleteUser(context.userId);
    if (error) throw error;
    return { deleted: true };
  });
