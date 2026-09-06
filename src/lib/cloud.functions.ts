import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Trip, WorkspaceState } from "@/lib/types";

type UntypedSupabase = { from: (relation: string) => any };
type StoredTrip = { id: string; trip_uuid: string };

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
    (input: { name: string; template: string; start: string; budget: number }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as UntypedSupabase;
    const { data: trip, error } = await db
      .from("trips")
      .insert({
        workspace_user_id: userId,
        name: data.name,
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

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { data: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workspaces")
      .upsert({ user_id: userId, data: data.data as never }, { onConflict: "user_id" });
    if (error) throw error;
    try {
      await syncTripsFromWorkspaceJson(
        supabase as unknown as UntypedSupabase,
        userId,
        data.data as WorkspaceState,
      );
      return { ok: true, relationalSynced: true };
    } catch (syncError) {
      // De JSON-opslag blijft de veilige terugval totdat de UUID-migratie in
      // Lovable is uitgevoerd. Falen van alleen de nieuwe tabellen mag geen
      // bestaande reiswijziging ongedaan maken.
      console.warn("Relationele reissync nog niet beschikbaar", syncError);
      return { ok: true, relationalSynced: false };
    }
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
