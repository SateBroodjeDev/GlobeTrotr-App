import { createServerFn } from "@tanstack/react-start";

export type PublicStop = { name: string; country: string; lat: number; lon: number };
export type PublicDay = { day: string; title: string; notes?: string | undefined };

export type PublicTripCard = {
  token: string;
  tripId: string;
  name: string;
  template: string;
  start: string;
  end: string;
  stops: PublicStop[];
  brandName: string;
};

export type PublicTripDetail = PublicTripCard & {
  itinerary: PublicDay[];
  budget?: number;
  currency?: string;
};

type Row = {
  data: unknown;
  public_token: string;
  share_financials: boolean;
};

type AnyTrip = Record<string, unknown>;

function tripsOf(row: Row): AnyTrip[] {
  const data = row.data as { trips?: AnyTrip[] } | null;
  if (!data || !Array.isArray(data.trips)) return [];
  return data.trips.filter((t) => t && (t as { public?: boolean }).public === true);
}

function brandOf(row: Row): string {
  const data = row.data as { branding?: { brandName?: string } } | null;
  return data?.branding?.brandName ?? "GlobeTrotr";
}

function card(row: Row, t: AnyTrip): PublicTripCard {
  const stops = Array.isArray(t['stops']) ? (t['stops'] as AnyTrip[]) : [];
  return {
    token: row.public_token,
    tripId: String(t['id'] ?? ""),
    name: String(t['name'] ?? "Reis"),
    template: String(t['template'] ?? "citytrip"),
    start: String(t['start'] ?? ""),
    end: String(t['end'] ?? ""),
    brandName: brandOf(row),
    stops: stops.map((s) => ({
      name: String(s['name'] ?? ""),
      country: String(s['country'] ?? ""),
      lat: Number(s['lat'] ?? 0),
      lon: Number(s['lon'] ?? 0),
    })),
  };
}

export const listPublicTrips = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("data, public_token, share_financials")
    .eq("share_enabled", true)
    .limit(50);
  if (error) return [] as PublicTripCard[];
  const out: PublicTripCard[] = [];
  for (const row of (data ?? []) as Row[]) {
    for (const t of tripsOf(row)) out.push(card(row, t));
  }
  return out.slice(0, 60);
});

export const getPublicTrip = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string; tripId: string }) => input)
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("data, public_token, share_financials")
      .eq("public_token", input.token)
      .eq("share_enabled", true)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Row;
    const trip = tripsOf(row).find((t) => String(t['id']) === input.tripId);
    if (!trip) return null;
    const detail: PublicTripDetail = {
      ...card(row, trip),
      itinerary: (Array.isArray(trip['itinerary']) ? (trip['itinerary'] as AnyTrip[]) : []).map(
        (d) => ({
          day: String(d['day'] ?? ""),
          title: String(d['title'] ?? ""),
          notes: d['notes'] ? String(d['notes']) : undefined,
        }),
      ),
    };
    if (row.share_financials) {
      detail.budget = Number(trip['budget'] ?? 0);
      detail.currency = "EUR";
    }
    return detail;
  });
