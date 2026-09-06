import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Trip, WorkspaceState } from "@/lib/types";

type UntypedSupabase = { from: (relation: string) => any };
type StoredTrip = { id: string; trip_uuid: string };

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Keep invalid trip settings out of both relational storage and the JSON backup. */
function normalizeTripForPersistence(trip: Trip): Trip {
  const name = trip.name.trim();
  if (!name) throw new Error("Een reisnaam is verplicht.");
  if (!isIsoDate(trip.start) || !isIsoDate(trip.end)) {
    throw new Error("Vul een geldige start- en einddatum in.");
  }
  if (trip.end < trip.start) throw new Error("De einddatum kan niet vóór de startdatum liggen.");
  if (!Number.isFinite(trip.budget) || trip.budget < 0) {
    throw new Error("Het budget moet een bedrag van nul of hoger zijn.");
  }
  return { ...trip, name };
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
  const { data: parents, error } = await client
    .from("trips")
    .select(
      "trip_uuid, name, template, start_date, end_date, budget, travelers, archived, is_public, share_financials, share_pin_hash",
    )
    .eq("workspace_user_id", userId)
    .order("start_date", { ascending: true });
  if (error) throw error;
  const rows = (parents ?? []) as Record<string, any>[];
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
    return {
      id,
      name: String(row.name ?? "Reis"),
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
      })),
      expenses: (expensesByTrip.get(id) ?? []).map((expense) => ({
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
          email: String(member.email),
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
      .select("trip_uuid")
      .single();
    if (error) throw error;
    const tripUuid = (trip as { trip_uuid?: unknown } | null)?.trip_uuid;
    if (typeof tripUuid !== "string") throw new Error("Reis-ID kon niet worden aangemaakt.");
    return { tripId: tripUuid };
  });

/** Keeps public visibility reliable even if a later child-row sync fails. */
export const syncTripPublication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      tripId: string;
      isPublic: boolean;
      shareFinancials: boolean;
      sharePinHash?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const fields = {
      is_public: data.isPublic,
      share_financials: data.shareFinancials,
      share_pin_hash: data.sharePinHash ?? null,
    };
    const { data: byUuid, error: uuidError } = await db
      .from("trips")
      .update(fields)
      .eq("workspace_user_id", context.userId)
      .eq("trip_uuid", data.tripId)
      .select("trip_uuid")
      .maybeSingle();
    if (!uuidError && byUuid) return { synced: true };

    // Alleen tijdens de overgang kan de browser nog een oude JSON-ID hebben.
    const { data: byLegacyId, error: legacyError } = await db
      .from("trips")
      .update(fields)
      .eq("workspace_user_id", context.userId)
      .eq("id", data.tripId)
      .select("trip_uuid")
      .maybeSingle();
    if (legacyError) throw legacyError;
    return { synced: Boolean(byLegacyId) };
  });

/** Primary write path for a private trip and all of its child records. */
export const saveTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { trip: Trip }) => input)
  .handler(async ({ data, context }) => {
    const trip = normalizeTripForPersistence(data.trip);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const saved = await saveRelationalTrip(db, context.userId, trip);
    await updateTripJsonBackup(db, context.userId, trip, saved.id);
    return { tripId: saved.trip_uuid };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { data: stored, error } = await db
      .from("trips")
      .delete()
      .eq("workspace_user_id", context.userId)
      .eq("trip_uuid", data.tripId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    const { data: workspace, error: workspaceError } = await db
      .from("workspaces")
      .select("data")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    const current = (workspace?.data ?? {}) as Partial<WorkspaceState>;
    const dataCopy = {
      ...current,
      trips: (current.trips ?? []).filter(
        (trip) => trip.id !== data.tripId && trip.id !== (stored as StoredTrip | null)?.id,
      ),
    };
    const { error: backupError } = await db
      .from("workspaces")
      .upsert({ user_id: context.userId, data: dataCopy }, { onConflict: "user_id" });
    if (backupError) throw backupError;
    return { deleted: Boolean(stored) };
  });

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { data: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { error } = await db
      .from("workspaces")
      .upsert({ user_id: context.userId, data: data.data as never }, { onConflict: "user_id" });
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
