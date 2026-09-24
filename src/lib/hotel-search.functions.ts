import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireTripManagementAccess } from "@/lib/trip-management-access.server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cache = new Map<string, { expires: number; results: HotelSearchResult[] }>();
const calls = new Map<string, number[]>();
const SEARCH_RADIUS_METERS = 15_000;

export type HotelSearchResult = { id: string; name: string; kind: string; lat: number; lon: number; distanceKm: number; website?: string; osmUrl: string; stars?: string };

function safeUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined; } catch { return undefined; }
}
function distanceKm(a:number,b:number,c:number,d:number){const r=6371,toRad=(x:number)=>x*Math.PI/180;const p1=toRad(a),p2=toRad(c),dp=toRad(c-a),dl=toRad(d-b);const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}

export const searchNearbyHotels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { tripId: string; lat: number; lon: number }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.tripId) || !Number.isFinite(data.lat) || !Number.isFinite(data.lon) || Math.abs(data.lat) > 90 || Math.abs(data.lon) > 180) throw new Error("INVALID_HOTEL_SEARCH");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: trip } = await db.from("trips").select("workspace_user_id").eq("trip_uuid", data.tripId).maybeSingle();
    if (!trip) throw new Error("TRIP_NOT_FOUND");
    if (trip.workspace_user_id !== context.userId) {
      const { data: member } = await db.from("trip_members").select("id").eq("trip_uuid", data.tripId).eq("user_id", context.userId).eq("status", "active").maybeSingle();
      if (!member) await requireTripManagementAccess(db, context.userId, data.tripId, "trips_view");
    }
    const now = Date.now(), recent = (calls.get(context.userId) ?? []).filter((time) => now - time < 60_000);
    if (recent.length >= 8) throw new Error("HOTEL_SEARCH_RATE_LIMIT");
    recent.push(now); calls.set(context.userId, recent);
    if (cache.size > 500) for (const [cacheKey, value] of cache) if (value.expires <= now) cache.delete(cacheKey);
    const key = `${SEARCH_RADIUS_METERS}:${data.lat.toFixed(3)}:${data.lon.toFixed(3)}`;
    const cached = cache.get(key); if (cached && cached.expires > now) return { results: cached.results, cached: true };
    const endpoints = [...new Set([
      process.env.OVERPASS_API_URL,
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ].filter((value): value is string => Boolean(value)))];
    const query = `[out:json][timeout:18];nwr["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet)$"](around:${SEARCH_RADIUS_METERS},${data.lat},${data.lon});out center tags 50;`;
    let payload: { elements?: any[] } | undefined;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "GlobeTrotr/1.1 (https://globetrotr.nl/contact)" }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(22_000) });
        if (!response.ok) continue;
        payload = await response.json() as { elements?: any[] };
        break;
      } catch { /* Try the next public Overpass instance. */ }
    }
    if (!payload) throw new Error("HOTEL_SEARCH_UNAVAILABLE");
    const results = (payload.elements ?? []).map((element) => { const lat=Number(element.lat ?? element.center?.lat),lon=Number(element.lon ?? element.center?.lon),tags=element.tags??{}; return { id:`${element.type}/${element.id}`,name:String(tags.name??"").trim().slice(0,160),kind:String(tags.tourism??"hotel").slice(0,40),lat,lon,distanceKm:Number(distanceKm(data.lat,data.lon,lat,lon).toFixed(1)),website:safeUrl(tags["contact:website"]??tags.website),osmUrl:`https://www.openstreetmap.org/${element.type}/${element.id}`,stars:tags.stars ? String(tags.stars).slice(0,10) : undefined }; }).filter((item) => item.name && Number.isFinite(item.lat) && Number.isFinite(item.lon)).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,20);
    cache.set(key, { expires: now + 15 * 60_000, results });
    return { results, cached: false };
  });
