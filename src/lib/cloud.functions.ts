import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Trip, TripMemberRole, WorkspaceState } from "@/lib/types";
import { protectTripUpdate } from "@/lib/trip-access";
import { TRIP_DESCRIPTION_MAX_LENGTH, TRIP_NAME_MAX_LENGTH } from "@/lib/trip-limits";

type UntypedSupabase = {
  from: (relation: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};
type StoredTrip = { id: string; trip_uuid: string };

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Keep invalid trip settings out of both relational storage and the JSON backup. */
function normalizeTripForPersistence(trip: Trip): Trip {
  const name = trip.name.trim();
  const description = trip.description?.trim();
  if (!name) throw new Error("Een reisnaam is verplicht.");
  if (name.length > TRIP_NAME_MAX_LENGTH) {
    throw new Error(`De reisnaam mag maximaal ${TRIP_NAME_MAX_LENGTH} tekens bevatten.`);
  }
  if (description && description.length > TRIP_DESCRIPTION_MAX_LENGTH) {
    throw new Error(
      `De reisomschrijving mag maximaal ${TRIP_DESCRIPTION_MAX_LENGTH} tekens bevatten.`,
    );
  }
  if (!isIsoDate(trip.start) || !isIsoDate(trip.end)) {
    throw new Error("Vul een geldige start- en einddatum in.");
  }
  if (trip.end < trip.start) throw new Error("De einddatum kan niet vóór de startdatum liggen.");
  if (!Number.isFinite(trip.budget) || trip.budget < 0) {
    throw new Error("Het budget moet een bedrag van nul of hoger zijn.");
  }
  const { accessRole: _accessRole, ownerId: _ownerId, ...persistentTrip } = trip;
  return { ...persistentTrip, name, description };
}

async function withinTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Relationele reissync duurde te lang.")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Transitional write-through while workspace.data is still used by the UI.
 * The UUID migration is optional here: users can deploy this code before
 * running it without losing their JSON workspace.
 */
async function syncTripsFromWorkspaceJson(
  client: UntypedSupabase,
  userId: string,
  workspace: WorkspaceState,
) {
  const { data: stored, error: storedError } = await client
    .from("trips")
    .select("id, trip_uuid")
    .eq("workspace_user_id", userId);
  if (storedError) throw storedError;

  const storedTrips = (stored ?? []) as StoredTrip[];
  const storedByLegacyId = new Map(storedTrips.map((trip) => [trip.id, trip]));
  const storedByUuid = new Map(storedTrips.map((trip) => [trip.trip_uuid, trip]));
  const persistedLegacyIds = new Set<string>();
  for (const trip of workspace.trips) {
    const existing = storedByLegacyId.get(trip.id) ?? storedByUuid.get(trip.id);
    const legacyId = existing?.id ?? trip.id;
    const { data: savedTrip, error: tripError } = await client
      .from("trips")
      .upsert(
        {
          workspace_user_id: userId,
          id: legacyId,
          name: trip.name,
          description: trip.description ?? null,
          template: trip.template,
          start_date: trip.start || null,
          end_date: trip.end || null,
          budget: trip.budget,
          travelers: trip.travelers ?? [],
          archived: trip.archived ?? false,
          is_public: trip.public ?? false,
          share_financials: trip.shareFinancials ?? false,
          share_pin_hash: trip.sharePinHash ?? null,
        },
        { onConflict: "workspace_user_id,id" },
      )
      .select("id, trip_uuid")
      .single();
    if (tripError) throw tripError;
    const saved = savedTrip as StoredTrip;
    persistedLegacyIds.add(saved.id);
    await replaceTripChildren(client, userId, trip, saved.id, saved.trip_uuid);
  }

  for (const savedTrip of storedTrips) {
    if (!persistedLegacyIds.has(savedTrip.id)) {
      const { error } = await client
        .from("trips")
        .delete()
        .eq("workspace_user_id", userId)
        .eq("trip_uuid", savedTrip.trip_uuid);
      if (error) throw error;
    }
  }
}

async function replaceTripChildren(
  client: UntypedSupabase,
  userId: string,
  trip: Trip,
  legacyTripId: string,
  tripUuid: string,
) {
  const scope = { workspace_user_id: userId, trip_id: legacyTripId, trip_uuid: tripUuid };
  const replace = async (table: string, rows: Record<string, unknown>[]) => {
    const { error: deleteError } = await client.from(table).delete().eq("trip_uuid", tripUuid);
    if (deleteError) throw deleteError;
    if (!rows.length) return;
    const { error: insertError } = await client.from(table).insert(rows);
    if (insertError) throw insertError;
  };

  await replace(
    "trip_stops",
    trip.stops.map(({ arrive, ...stop }, position) => ({
      ...scope,
      ...stop,
      position,
      arrive_date: arrive ?? null,
    })),
  );
  await replace(
    "trip_itinerary_items",
    trip.itinerary.map((item, position) => ({
      ...scope,
      id: item.id,
      day: item.day,
      title: item.title,
      notes: item.notes ?? null,
      source_travel_item_id: item.sourceTravelItemId ?? null,
      position,
    })),
  );
  await replace(
    "trip_expenses",
    trip.expenses.map((expense) => ({
      ...scope,
      id: expense.id,
      expense_date: expense.date,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      paid_by: expense.paidBy,
      billable: expense.billable,
      split_with: expense.splitWith ?? [],
      receipt_path: expense.receiptPath ?? null,
      receipt_name: expense.receiptName ?? null,
      notes: expense.notes ?? null,
    })),
  );
  await replace(
    "trip_travel_items",
    (trip.travelItems ?? []).map((item) => ({
      ...scope,
      id: item.id,
      item_type: item.type,
      title: item.title,
      start_date: item.date,
      end_date: item.endDate ?? null,
      provider: item.provider ?? null,
      booking_reference: item.bookingReference ?? null,
      flight_number: item.flightNumber ?? null,
      flight_status: item.flightStatus ?? null,
      departure: item.departure ?? null,
      arrival: item.arrival ?? null,
      location: item.location ?? null,
      amount: item.amount ?? null,
      currency: item.currency ?? null,
      expense_id: item.expenseId ?? null,
      notes: item.notes ?? null,
      details: item.details ?? {},
    })),
  );
  await replace(
    "trip_packing_items",
    (trip.packing ?? []).map((item, position) => ({ ...scope, ...item, position })),
  );

  // De eigenaar wordt door de database-trigger beheerd en mag niet uit de
  // JSON-snapshot verdwijnen. De overige reisgenoten komen uit Instellingen.
  const { error: deleteMembersError } = await client
    .from("trip_members")
    .delete()
    .eq("trip_uuid", tripUuid)
    .neq("role", "owner");
  if (deleteMembersError) throw deleteMembersError;
  const members = (trip.members ?? []).map((member) => ({
    ...scope,
    id: member.id,
    user_id: null,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    invited_at: member.invitedAt,
    accepted_at: null,
  }));
  if (members.length) {
    const { error: memberError } = await client.from("trip_members").insert(members);
    if (memberError) throw memberError;
  }
}

async function saveRelationalTrip(client: UntypedSupabase, userId: string, trip: Trip) {
  const { data: existingByUuid } = await client
    .from("trips")
    .select("id, trip_uuid")
    .eq("workspace_user_id", userId)
    .eq("trip_uuid", trip.id)
    .maybeSingle();
  const legacyId = (existingByUuid as StoredTrip | null)?.id ?? trip.id;
  const { data: savedTrip, error } = await client
    .from("trips")
    .upsert(
      {
        workspace_user_id: userId,
        id: legacyId,
        trip_uuid: trip.id,
        name: trip.name,
        description: trip.description ?? null,
        template: trip.template,
        start_date: trip.start || null,
        end_date: trip.end || null,
        budget: trip.budget,
        travelers: trip.travelers ?? [],
        archived: trip.archived ?? false,
        is_public: trip.public ?? false,
        share_financials: trip.shareFinancials ?? false,
        share_pin_hash: trip.sharePinHash ?? null,
      },
      { onConflict: "workspace_user_id,id" },
    )
    .select("id, trip_uuid")
    .single();
  if (error) throw error;
  const saved = savedTrip as StoredTrip;
  await replaceTripChildren(client, userId, trip, saved.id, saved.trip_uuid);
  return saved;
}

async function updateTripJsonBackup(
  client: UntypedSupabase,
  userId: string,
  trip: Trip,
  legacyTripId: string,
) {
  const { data: workspace, error } = await client
    .from("workspaces")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const current = (workspace?.data ?? {}) as Partial<WorkspaceState>;
  const trips = Array.isArray(current.trips) ? current.trips : [];
  const normalized = { ...trip, id: trip.id };
  const exists = trips.some((item) => item.id === trip.id || item.id === legacyTripId);
  const data = {
    ...current,
    trips: exists
      ? trips.map((item) => (item.id === trip.id || item.id === legacyTripId ? normalized : item))
      : [...trips, normalized],
  };
  const { error: updateError } = await client
    .from("workspaces")
    .upsert({ user_id: userId, data }, { onConflict: "user_id" });
  if (updateError) throw updateError;
}

function withDatabaseTripIds(data: unknown, rows: StoredTrip[]): unknown {
  if (!data || typeof data !== "object") return data;
  const workspace = data as WorkspaceState;
  if (!Array.isArray(workspace.trips)) return data;
  const byLegacyId = new Map(rows.map((trip) => [trip.id, trip.trip_uuid]));
  return {
    ...workspace,
    trips: workspace.trips.map((trip) => ({
      ...trip,
      // Oude JSON-data bewaart de tijdelijke tekst-ID. De app gebruikt vanaf
      // hier de database-UUID voor private routes en alle nieuwe writes.
      id: byLegacyId.get(trip.id) ?? trip.id,
    })),
  } satisfies WorkspaceState;
}

async function loadRelationalTrips(client: UntypedSupabase, userId: string): Promise<Trip[]> {
  const parentColumns =
    "trip_uuid, workspace_user_id, revision::text, name, description, template, start_date, end_date, budget, travelers, archived, is_public, share_financials, share_pin_hash";
  const [{ data: ownedParents, error: ownedError }, { data: memberships, error: membershipError }] =
    await Promise.all([
      client
        .from("trips")
        .select(parentColumns)
        .eq("workspace_user_id", userId)
        .order("start_date", { ascending: true }),
      client
        .from("trip_members")
        .select("trip_uuid, role")
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("role", "owner"),
    ]);
  if (ownedError) throw ownedError;
  if (membershipError) throw membershipError;
  const membershipRows = (memberships ?? []) as { trip_uuid: string; role: TripMemberRole }[];
  const sharedIds = membershipRows.map((membership) => membership.trip_uuid);
  const { data: sharedParents, error: sharedError } = sharedIds.length
    ? await client
        .from("trips")
        .select(parentColumns)
        .in("trip_uuid", sharedIds)
        .order("start_date", { ascending: true })
    : { data: [], error: null };
  if (sharedError) throw sharedError;
  const accessByTrip = new Map<string, TripMemberRole>(
    membershipRows.map((membership) => [String(membership.trip_uuid), membership.role]),
  );
  const rows = [
    ...((ownedParents ?? []) as Record<string, any>[]),
    ...((sharedParents ?? []) as Record<string, any>[]),
  ];
  const ids = rows.map((row) => String(row.trip_uuid));
  if (!ids.length) return [];
  const [stops, itinerary, expenses, travelItems, packing, members] = await Promise.all([
    client.from("trip_stops").select("*").in("trip_uuid", ids).order("position"),
    client.from("trip_itinerary_items").select("*").in("trip_uuid", ids).order("position"),
    client.from("trip_expenses").select("*").in("trip_uuid", ids),
    client.from("trip_travel_items").select("*").in("trip_uuid", ids),
    client.from("trip_packing_items").select("*").in("trip_uuid", ids).order("position"),
    client.from("trip_members").select("*").in("trip_uuid", ids),
  ]);
  const childError = [stops, itinerary, expenses, travelItems, packing, members].find(
    (result) => result.error,
  )?.error;
  if (childError) throw childError;
  const grouped = (result: { data?: unknown }, key = "trip_uuid") => {
    const map = new Map<string, Record<string, any>[]>();
    for (const row of (result.data ?? []) as Record<string, any>[]) {
      const id = String(row[key]);
      map.set(id, [...(map.get(id) ?? []), row]);
    }
    return map;
  };
  const stopsByTrip = grouped(stops);
  const itineraryByTrip = grouped(itinerary);
  const expensesByTrip = grouped(expenses);
  const travelByTrip = grouped(travelItems);
  const packingByTrip = grouped(packing);
  const membersByTrip = grouped(members);
  return rows.map((row) => {
    const id = String(row.trip_uuid);
    const accessRole = accessByTrip.get(id) ?? "owner";
    const maySeeMoney = ["owner", "traveler", "advisor", "finance"].includes(accessRole);
    return {
      id,
      ownerId: String(row.workspace_user_id),
      accessRole,
      ...(row["revision"] == null ? {} : { revision: String(row["revision"]) }),
      name: String(row.name ?? "Reis"),
      ...(row.description ? { description: String(row.description) } : {}),
      template: row.template,
      start: row.start_date ?? "",
      end: row.end_date ?? "",
      budget: Number(row.budget ?? 0),
      travelers: Array.isArray(row.travelers) ? row.travelers : [],
      archived: Boolean(row.archived),
      public: Boolean(row.is_public),
      shareFinancials: Boolean(row.share_financials),
      ...(row.share_pin_hash ? { sharePinHash: String(row.share_pin_hash) } : {}),
      stops: (stopsByTrip.get(id) ?? []).map((stop) => ({
        id: String(stop.id),
        name: String(stop.name),
        country: String(stop.country ?? ""),
        lat: Number(stop.lat),
        lon: Number(stop.lon),
        arrive: stop.arrive_date ?? undefined,
        nights: stop.nights ?? undefined,
      })),
      itinerary: (itineraryByTrip.get(id) ?? []).map((item) => ({
        id: String(item.id),
        day: String(item.day),
        title: String(item.title),
        notes: item.notes ?? undefined,
        sourceTravelItemId: item.source_travel_item_id ?? undefined,
      })),
      expenses: (maySeeMoney ? (expensesByTrip.get(id) ?? []) : []).map((expense) => ({
        id: String(expense.id),
        date: String(expense.expense_date),
        title: String(expense.title),
        category: expense.category,
        amount: Number(expense.amount),
        currency: String(expense.currency),
        paidBy: String(expense.paid_by),
        billable: Boolean(expense.billable),
        splitWith: Array.isArray(expense.split_with) ? expense.split_with : [],
        receiptPath: expense.receipt_path ?? undefined,
        receiptName: expense.receipt_name ?? undefined,
        notes: expense.notes ?? undefined,
      })),
      travelItems: (travelByTrip.get(id) ?? []).map((item) => ({
        id: String(item.id),
        type: item.item_type,
        title: String(item.title),
        date: String(item.start_date),
        endDate: item.end_date ?? undefined,
        provider: item.provider ?? undefined,
        bookingReference: item.booking_reference ?? undefined,
        flightNumber: item.flight_number ?? undefined,
        flightStatus: item.flight_status ?? undefined,
        departure: item.departure ?? undefined,
        arrival: item.arrival ?? undefined,
        location: item.location ?? undefined,
        amount: item.amount === null ? undefined : Number(item.amount),
        currency: item.currency ?? undefined,
        expenseId: item.expense_id ?? undefined,
        notes: item.notes ?? undefined,
        details: item.details ?? undefined,
      })),
      packing: (packingByTrip.get(id) ?? []).map((item) => ({
        id: String(item.id),
        label: String(item.label),
        done: Boolean(item.done),
      })),
      members: (membersByTrip.get(id) ?? [])
        .filter((member) => member.role !== "owner")
        .map((member) => ({
          id: String(member.id),
          name: String(member.name),
          email: accessRole === "owner" ? String(member.email) : "",
          role: member.role,
          status: member.status,
          invitedAt: String(member.invited_at),
        })),
    } as Trip;
  });
}

export const loadWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("workspaces")
      .select("data, public_token, share_enabled, share_financials")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    try {
      const db = supabase as unknown as UntypedSupabase;
      const relationalTrips = await loadRelationalTrips(db, userId);
      const jsonWorkspace = data.data as WorkspaceState;
      if (relationalTrips.length || !jsonWorkspace?.trips?.length) {
        return { ...data, data: { ...jsonWorkspace, trips: relationalTrips } };
      }
      const { data: trips, error: tripsError } = await db
        .from("trips")
        .select("id, trip_uuid")
        .eq("workspace_user_id", userId);
      if (tripsError) throw tripsError;
      return { ...data, data: withDatabaseTripIds(data.data, (trips ?? []) as StoredTrip[]) };
    } catch {
      // De eerste UUID-migratie kan nog niet uitgevoerd zijn; JSON is dan de
      // compatibele bron tot de relationele tabellen beschikbaar zijn.
      return data;
    }
  });

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { tripId: string; name: string; template: string; start: string; budget: number }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const name = data.name.trim();
    if (!name) throw new Error("Een reisnaam is verplicht.");
    if (name.length > TRIP_NAME_MAX_LENGTH) {
      throw new Error(`De reisnaam mag maximaal ${TRIP_NAME_MAX_LENGTH} tekens bevatten.`);
    }
    if (!isIsoDate(data.start)) throw new Error("Vul een geldige startdatum in.");
    if (!Number.isFinite(data.budget) || data.budget < 0) {
      throw new Error("Het budget moet een bedrag van nul of hoger zijn.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { data: trip, error } = await db
      .from("trips")
      .insert({
        // Alleen de middleware bepaalt de eigenaar; de browser kan dit nooit invullen.
        workspace_user_id: context.userId,
        id: data.tripId,
        trip_uuid: data.tripId,
        name,
        template: data.template,
        start_date: data.start,
        end_date: data.start,
        budget: data.budget,
      })
      .select("trip_uuid, revision::text")
      .single();
    if (error) throw error;
    const tripUuid = (trip as { trip_uuid?: unknown } | null)?.trip_uuid;
    if (typeof tripUuid !== "string") throw new Error("Reis-ID kon niet worden aangemaakt.");
    return { tripId: tripUuid, revision: String(trip.revision) };
  });

/** Primary version-checked, atomic write path, including publication settings. */
export const saveTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { trip: Trip }) => input)
  .handler(async ({ data, context }) => {
    let trip = normalizeTripForPersistence(data.trip);
    if (!trip.revision || !/^\d+$/.test(trip.revision)) {
      throw new Error(
        "De reisversie ontbreekt. Herlaad de pagina; controleer of de versiemigratie is uitgevoerd.",
      );
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { data: storedTrip, error: storedError } = await db
      .from("trips")
      .select("workspace_user_id")
      .eq("trip_uuid", trip.id)
      .maybeSingle();
    if (storedError || !storedTrip) throw new Error("Reis niet gevonden.");
    const ownerId = String(storedTrip.workspace_user_id);
    let accessRole: TripMemberRole = "owner";
    if (ownerId !== context.userId) {
      const { data: membership, error: membershipError } = await db
        .from("trip_members")
        .select("role")
        .eq("trip_uuid", trip.id)
        .eq("user_id", context.userId)
        .eq("status", "active")
        .maybeSingle();
      if (membershipError || !membership) throw new Error("Je hebt geen toegang tot deze reis.");
      accessRole = membership.role as TripMemberRole;
    }
    if (accessRole === "viewer" || accessRole === "client") {
      throw new Error("Je hebt alleen-lezen toegang tot deze reis.");
    }
    if (accessRole !== "owner") {
      const current = (await loadRelationalTrips(db, ownerId)).find((item) => item.id === trip.id);
      if (!current) throw new Error("Reis niet gevonden.");
      trip = protectTripUpdate(current, trip, accessRole);
      trip = normalizeTripForPersistence(trip);
    }
    const { data: saved, error } = await db.rpc("save_trip_snapshot_versioned", {
      p_workspace_user_id: ownerId,
      p_trip: trip,
    });
    if (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      if (code === "PT409") {
        throw new Error(
          "Deze reis is intussen gewijzigd of verwijderd in een ander tabblad of op een ander apparaat. Je wijziging is niet opgeslagen. Kopieer je invoer en herlaad de pagina.",
        );
      }
      if (code === "PGRST202") {
        throw new Error(
          "De database-update voor veilige reisopslag ontbreekt. Voer de versiemigratie uit en herlaad de pagina.",
        );
      }
      throw new Error(
        "Reis kon niet worden opgeslagen. Kopieer je invoer en herlaad de pagina voordat je opnieuw probeert.",
      );
    }
    const row = Array.isArray(saved) ? saved[0] : saved;
    if (
      !row ||
      typeof row !== "object" ||
      !("trip_uuid" in row) ||
      !("revision" in row) ||
      typeof row.trip_uuid !== "string" ||
      typeof row.revision !== "string"
    ) {
      throw new Error("Opslag kon niet worden bevestigd. Herlaad de pagina voordat je verdergaat.");
    }
    return { tripId: row.trip_uuid, revision: row.revision };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string; revision: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { error } = await db.rpc("delete_trip_versioned", {
      p_workspace_user_id: context.userId,
      p_trip_id: data.tripId,
      p_revision: data.revision,
    });
    if (error) {
      throw new Error(
        "Reis kon niet worden verwijderd. Mogelijk is deze intussen gewijzigd. Herlaad de pagina voordat je opnieuw probeert.",
      );
    }
    return { deleted: true };
  });

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { data: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const workspace = data.data as Partial<WorkspaceState>;
    const plan = ["free", "pro", "agency"].includes(workspace.plan ?? "") ? workspace.plan : "free";
    const baseCurrency =
      typeof workspace.baseCurrency === "string" && /^[A-Z]{3}$/.test(workspace.baseCurrency)
        ? workspace.baseCurrency
        : "EUR";
    const { error } = await db.from("workspaces").upsert(
      {
        user_id: context.userId,
        data: workspace as never,
        plan,
        base_currency: baseCurrency,
        branding: workspace.branding ?? {},
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const updateSharing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { share_enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("workspaces")
      .update({
        share_enabled: data.share_enabled,
      })
      .eq("user_id", userId)
      .select("public_token, share_enabled")
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Workspace niet gevonden.");
    return row;
  });
