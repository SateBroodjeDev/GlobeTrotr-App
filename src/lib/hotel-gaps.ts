import type { Stop, TravelItem, Trip } from "./types";

export type HotelGap = {
  id: string;
  stopId: string;
  stopName: string;
  country: string;
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  nights: number;
};

export type TripHotelGap = {
  id: string;
  startDate: string;
  endDate: string;
  nights: number;
  suggestedStopId?: string;
  confidence: "overnight" | "route" | "unknown";
};

export function configuredRouteNights(stops: Stop[]) {
  return stops.reduce((total, stop) => total + (
    DATE.test(stop.arrive ?? "") && Number.isFinite(stop.nights) && Number(stop.nights) > 0
      ? Math.min(366, Math.floor(Number(stop.nights)))
      : 0
  ), 0);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const day = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

/** Finds route nights that are not covered by a booked lodging item. */
export function findHotelGaps(stops: Stop[], travelItems: TravelItem[] = []): HotelGap[] {
  const covered = new Set<string>();
  for (const item of travelItems) {
    if (item.type !== "lodging" || !DATE.test(item.date)) continue;
    const end = DATE.test(item.endDate ?? "") && String(item.endDate) > item.date
      ? String(item.endDate)
      : day(item.date, 1);
    for (let date = item.date, guard = 0; date < end && guard < 366; date = day(date, 1), guard += 1) {
      covered.add(date);
    }
  }

  const gaps: HotelGap[] = [];
  for (const stop of stops) {
    if (!DATE.test(stop.arrive ?? "") || !Number.isFinite(stop.nights) || Number(stop.nights) < 1) continue;
    let openStart: string | undefined;
    const nights = Math.min(366, Math.floor(Number(stop.nights)));
    for (let offset = 0; offset <= nights; offset += 1) {
      const date = day(String(stop.arrive), offset);
      const missing = offset < nights && !covered.has(date);
      if (missing && !openStart) openStart = date;
      if (!missing && openStart) {
        const count = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${openStart}T00:00:00Z`)) / 86_400_000);
        gaps.push({ id: `${stop.id}:${openStart}`, stopId: stop.id, stopName: stop.name, country: stop.country, lat: stop.lat, lon: stop.lon, startDate: openStart, endDate: date, nights: count });
        openStart = undefined;
      }
    }
  }
  return gaps;
}

/** Finds every uncovered night in the trip period and suggests the most likely route stop. */
export function findTripHotelGaps(trip: Pick<Trip, "start" | "end" | "stops" | "travelItems">): TripHotelGap[] {
  if (!DATE.test(trip.start) || !DATE.test(trip.end) || trip.end <= trip.start) return [];
  const covered = new Set<string>();
  for (const item of trip.travelItems ?? []) {
    if (item.type !== "lodging" || !DATE.test(item.date)) continue;
    const end = DATE.test(item.endDate ?? "") && String(item.endDate) > item.date ? String(item.endDate) : day(item.date, 1);
    for (let date = item.date, guard = 0; date < end && guard < 366; date = day(date, 1), guard += 1) covered.add(date);
  }

  const datedStops = [...trip.stops]
    .filter((stop) => DATE.test(stop.arrive ?? ""))
    .sort((a, b) => String(a.arrive).localeCompare(String(b.arrive)));
  const missing: Array<{ date: string; stopId?: string; confidence: TripHotelGap["confidence"] }> = [];
  for (let date = trip.start, guard = 0; date < trip.end && guard < 366; date = day(date, 1), guard += 1) {
    if (covered.has(date)) continue;
    const overnight = datedStops.find((stop) => {
      const nights = Math.max(0, Math.floor(Number(stop.nights) || 0));
      return nights > 0 && String(stop.arrive) <= date && date < day(String(stop.arrive), nights);
    });
    const latest = [...datedStops].reverse().find((stop) => String(stop.arrive) <= date);
    missing.push({ date, stopId: overnight?.id ?? latest?.id, confidence: overnight ? "overnight" : latest ? "route" : "unknown" });
  }

  const groups: TripHotelGap[] = [];
  for (const night of missing) {
    const previous = groups.at(-1);
    if (previous && previous.endDate === night.date && previous.suggestedStopId === night.stopId && previous.confidence === night.confidence) {
      previous.endDate = day(night.date, 1);
      previous.nights += 1;
    } else {
      groups.push({ id: `${night.date}:${night.stopId ?? "unknown"}`, startDate: night.date, endDate: day(night.date, 1), nights: 1, suggestedStopId: night.stopId, confidence: night.confidence });
    }
  }
  return groups;
}
