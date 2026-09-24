import { findHotelGaps } from "./hotel-gaps.ts";
import type { Trip } from "./types.ts";

export type TripReadiness = {
  stops: number;
  tripDays: number;
  plannedDays: number;
  routeNights: number;
  missingHotelNights: number;
  packingTotal: number;
  packingDone: number;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getTripReadiness(trip: Trip): TripReadiness {
  const start = DATE.test(trip.start) ? Date.parse(`${trip.start}T00:00:00Z`) : Number.NaN;
  const end = DATE.test(trip.end) ? Date.parse(`${trip.end}T00:00:00Z`) : Number.NaN;
  const tripDays = Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? Math.min(367, Math.floor((end - start) / 86_400_000) + 1)
    : 0;
  const plannedDays = new Set(trip.itinerary
    .map((item) => item.day)
    .filter((day) => DATE.test(day) && (!trip.start || day >= trip.start) && (!trip.end || day <= trip.end))).size;
  const routeNights = trip.stops.reduce((total, stop) => total + (Number.isFinite(stop.nights) && Number(stop.nights) > 0 ? Math.floor(Number(stop.nights)) : 0), 0);
  const packing = trip.packing ?? [];

  return {
    stops: trip.stops.length,
    tripDays,
    plannedDays,
    routeNights,
    missingHotelNights: findHotelGaps(trip.stops, trip.travelItems ?? []).reduce((total, gap) => total + gap.nights, 0),
    packingTotal: packing.length,
    packingDone: packing.filter((item) => item.done).length,
  };
}
