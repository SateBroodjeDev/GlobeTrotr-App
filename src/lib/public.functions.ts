import { createServerFn } from "@tanstack/react-start";

export type PublicStop = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  arrive?: string;
  nights?: number;
};
export type PublicDay = { day: string; title: string; notes?: string | undefined };

export type PublicTripCard = {
  token: string;
  tripId: string;
  name: string;
  template: string;
  start: string;
  end: string;
  stops: PublicStop[];
  authorName: string;
};

export type PublicTripDetail = PublicTripCard & {
  itinerary: PublicDay[];
  budget?: number;
  currency?: string;
};

export type PublicTripResult =
  { status: "not_found" } | { status: "pin_required" } | { status: "ok"; trip: PublicTripDetail };

type Row = {
  user_id: string;
  data: unknown;
  public_token: string;
};

type RelationalTrip = {
  trip_uuid: string;
  workspace_user_id: string;
  name: string;
  template: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | string;
  share_financials: boolean;
  share_pin_hash: string | null;
};

type RelationalStop = Omit<PublicStop, "arrive"> & {
  trip_uuid: string;
  arrive_date?: string | null;
  position?: number;
};
type RelationalDay = PublicDay & { trip_uuid: string; position: number };
type WorkspaceBrand = { user_id: string; public_token: string; branding: unknown; data: unknown };
type PublicProfile = { id: string; display_name: string | null; email: string | null };
type UntypedSupabase = { from: (relation: string) => any };

type AnyTrip = Record<string, unknown>;

function tripsOf(row: Row): AnyTrip[] {
  const data = row.data as { trips?: AnyTrip[] } | null;
  if (!data || !Array.isArray(data.trips)) return [];
  return data.trips.filter((t) => t && (t as { public?: boolean }).public === true);
}

function authorOf(profile?: PublicProfile): string {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (profile?.email) return profile.email.split("@")[0] || "Een GlobeTrotr-reiziger";
  return "Een GlobeTrotr-reiziger";
}

function relationalCard(
  workspace: WorkspaceBrand,
  trip: RelationalTrip,
  stops: RelationalStop[],
  authorName: string,
): PublicTripCard {
  return {
    token: workspace.public_token,
    tripId: trip.trip_uuid,
    name: trip.name,
    template: trip.template,
    start: trip.start_date ?? "",
    end: trip.end_date ?? "",
    authorName,
    stops: stops.map(({ trip_uuid: _tripUuid, arrive_date, position: _position, ...stop }) => ({
      ...stop,
      ...(arrive_date ? { arrive: arrive_date } : {}),
    })),
  };
}

function card(row: Row, t: AnyTrip, authorName: string): PublicTripCard {
  const stops = Array.isArray(t["stops"]) ? (t["stops"] as AnyTrip[]) : [];
  return {
    token: row.public_token,
    tripId: String(t["id"] ?? ""),
    name: String(t["name"] ?? "Reis"),
    template: String(t["template"] ?? "citytrip"),
    start: String(t["start"] ?? ""),
    end: String(t["end"] ?? ""),
    authorName,
    stops: stops.map((s) => ({
      name: String(s["name"] ?? ""),
      country: String(s["country"] ?? ""),
      lat: Number(s["lat"] ?? 0),
      lon: Number(s["lon"] ?? 0),
      ...(s["arrive"] ? { arrive: String(s["arrive"]) } : {}),
      ...(Number.isFinite(Number(s["nights"])) ? { nights: Number(s["nights"]) } : {}),
    })),
  };
}

export const listPublicTrips = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as UntypedSupabase;
  const { data: normalizedTrips, error: normalizedError } = await db
    .from("trips")
    .select(
      "trip_uuid, workspace_user_id, name, template, start_date, end_date, budget, share_financials, share_pin_hash",
    )
    .eq("is_public", true)
    .eq("archived", false)
    .limit(60);

  if (!normalizedError && Array.isArray(normalizedTrips)) {
    const trips = normalizedTrips as RelationalTrip[];
    if (trips.length === 0) return [] as PublicTripCard[];
    const tripIds = trips.map((trip) => trip.trip_uuid);
    const workspaceIds = [...new Set(trips.map((trip) => trip.workspace_user_id))];
    const [{ data: stops }, { data: workspaces }, { data: profiles }] = await Promise.all([
      db
        .from("trip_stops")
        .select("trip_uuid, name, country, lat, lon, arrive_date, nights, position")
        .in("trip_uuid", tripIds)
        .order("position"),
      db
        .from("workspaces")
        .select("user_id, public_token, branding, data")
        .in("user_id", workspaceIds),
      db.from("profiles").select("id, display_name, email").in("id", workspaceIds),
    ]);
    const stopsByTrip = new Map<string, RelationalStop[]>();
    for (const stop of (stops ?? []) as RelationalStop[]) {
      stopsByTrip.set(stop.trip_uuid, [...(stopsByTrip.get(stop.trip_uuid) ?? []), stop]);
    }
    const workspacesByUser = new Map(
      ((workspaces ?? []) as WorkspaceBrand[]).map((workspace) => [workspace.user_id, workspace]),
    );
    const profilesByUser = new Map(
      ((profiles ?? []) as PublicProfile[]).map((profile) => [profile.id, profile]),
    );
    return trips.flatMap((trip) => {
      const workspace = workspacesByUser.get(trip.workspace_user_id);
      return workspace
        ? [
            relationalCard(
              workspace,
              trip,
              stopsByTrip.get(trip.trip_uuid) ?? [],
              authorOf(profilesByUser.get(trip.workspace_user_id)),
            ),
          ]
        : [];
    });
  }

  // Voor bestaande omgevingen vóór de relationele migratie blijft JSON werken.
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("user_id, data, public_token")
    .limit(100);
  if (error) return [] as PublicTripCard[];
  const rows = (data ?? []) as Row[];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, email")
    .in(
      "id",
      rows.map((row) => row.user_id),
    );
  const profilesByUser = new Map(
    ((profiles ?? []) as PublicProfile[]).map((profile) => [profile.id, profile]),
  );
  const out: PublicTripCard[] = [];
  for (const row of rows) {
    const authorName = authorOf(profilesByUser.get(row.user_id));
    for (const t of tripsOf(row)) out.push(card(row, t, authorName));
  }
  return out.slice(0, 60);
});

export const getPublicTrip = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string; tripId: string; pin?: string }) => input)
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as UntypedSupabase;
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("user_id, data, public_token, branding")
      .eq("public_token", input.token)
      .maybeSingle();
    if (error || !data) return { status: "not_found" } as PublicTripResult;

    const workspace = data as WorkspaceBrand;
    const { data: profile } = await db
      .from("profiles")
      .select("id, display_name, email")
      .eq("id", workspace.user_id)
      .maybeSingle();
    const authorName = authorOf(profile as PublicProfile | null | undefined);
    const { data: byUuid, error: uuidError } = await db
      .from("trips")
      .select(
        "trip_uuid, workspace_user_id, name, template, start_date, end_date, budget, share_financials, share_pin_hash",
      )
      .eq("workspace_user_id", workspace.user_id)
      .eq("trip_uuid", input.tripId)
      .eq("is_public", true)
      .maybeSingle();
    // Oude URLs hebben nog de tijdelijke tekst-ID. Houd deze bruikbaar totdat
    // de private app en JSON-cache volledig op de UUID werken.
    const { data: byLegacyId } =
      byUuid || uuidError
        ? await db
            .from("trips")
            .select(
              "trip_uuid, workspace_user_id, name, template, start_date, end_date, budget, share_financials, share_pin_hash",
            )
            .eq("workspace_user_id", workspace.user_id)
            .eq("id", input.tripId)
            .eq("is_public", true)
            .maybeSingle()
        : { data: null };
    const normalizedTrip = (byUuid ?? byLegacyId) as RelationalTrip | null;
    if (normalizedTrip) {
      if (
        normalizedTrip.share_pin_hash &&
        (await hashPin(input.pin ?? "")) !== normalizedTrip.share_pin_hash
      ) {
        return { status: "pin_required" } as PublicTripResult;
      }
      const [{ data: stops }, { data: itinerary }] = await Promise.all([
        db
          .from("trip_stops")
          .select("trip_uuid, name, country, lat, lon, arrive_date, nights, position")
          .eq("trip_uuid", normalizedTrip.trip_uuid)
          .order("position"),
        db
          .from("trip_itinerary_items")
          .select("trip_uuid, day, title, notes, position")
          .eq("trip_uuid", normalizedTrip.trip_uuid)
          .order("day")
          .order("position"),
      ]);
      const detail: PublicTripDetail = {
        ...relationalCard(workspace, normalizedTrip, (stops ?? []) as RelationalStop[], authorName),
        itinerary: ((itinerary ?? []) as RelationalDay[]).map(
          ({ trip_uuid: _tripUuid, position: _position, ...item }) => item,
        ),
      };
      if (normalizedTrip.share_financials) {
        detail.budget = Number(normalizedTrip.budget ?? 0);
        detail.currency = "EUR";
      }
      return { status: "ok", trip: detail } as PublicTripResult;
    }

    const row = data as Row;
    const trip = tripsOf(row).find((t) => String(t["id"]) === input.tripId);
    if (!trip) return { status: "not_found" } as PublicTripResult;
    const pinHash = typeof trip["sharePinHash"] === "string" ? trip["sharePinHash"] : null;
    if (pinHash && (await hashPin(input.pin ?? "")) !== pinHash) {
      return { status: "pin_required" } as PublicTripResult;
    }
    const detail: PublicTripDetail = {
      ...card(row, trip, authorName),
      itinerary: (Array.isArray(trip["itinerary"]) ? (trip["itinerary"] as AnyTrip[]) : []).map(
        (d) => ({
          day: String(d["day"] ?? ""),
          title: String(d["title"] ?? ""),
          notes: d["notes"] ? String(d["notes"]) : undefined,
        }),
      ),
    };
    if (trip["shareFinancials"] === true) {
      detail.budget = Number(trip["budget"] ?? 0);
      detail.currency = "EUR";
    }
    return { status: "ok", trip: detail } as PublicTripResult;
  });

async function hashPin(pin: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
