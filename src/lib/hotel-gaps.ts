import type { Stop, TravelItem } from "./types";

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
