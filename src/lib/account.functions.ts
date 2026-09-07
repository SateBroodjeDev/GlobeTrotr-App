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
  "trip_invitations",
  "notifications",
] as const;

async function selectAccountRows(db: AdminClient, table: string, userId: string) {
  if (table === "profiles") return db.from(table).select("*").eq("id", userId);
  if (table === "workspaces" || table === "notifications") {
    return db.from(table).select("*").eq("user_id", userId);
  }
  if (table === "trips" || table.startsWith("trip_")) {
    if (table === "trip_members") {
      return db.from(table).select("*").or(`workspace_user_id.eq.${userId},user_id.eq.${userId}`);
    }
    if (table === "trip_invitations") {
      return db.from(table).select("*").eq("invited_by", userId);
    }
    return db.from(table).select("*").eq("workspace_user_id", userId);
  }
  throw new Error("Onbekende exporttabel.");
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
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as AdminClient;
    const { data: authData, error: authError } = await db.auth.admin.getUserById(context.userId);
    if (authError) throw authError;

    const entries = await Promise.all(
      EXPORT_TABLES.map(async (table) => {
        const { data, error } = await selectAccountRows(db, table, context.userId);
        if (error) throw error;
        return [table, data ?? []] as const;
      }),
    );
    const authUser = authData.user;
    return {
      format: "GlobeTrotr account export",
      formatVersion: 1,
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
      data: Object.fromEntries(entries),
      files: {
        note: "Uploaded files are not embedded. Their metadata and storage paths are included in the exported records.",
      },
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirmation: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.confirmation !== "DELETE") throw new Error("ACCOUNT_DELETE_CONFIRMATION_INVALID");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as AdminClient;
    await removeUserFiles(db, "avatars", context.userId);
    await removeUserFiles(db, "receipts", context.userId);
    const { error } = await db.auth.admin.deleteUser(context.userId);
    if (error) throw error;
    return { deleted: true };
  });
