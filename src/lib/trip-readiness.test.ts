import test from "node:test";
import assert from "node:assert/strict";
import { getTripReadiness } from "./trip-readiness.ts";
import type { Trip } from "./types.ts";

test("trip readiness reports planning, hotel and packing gaps without inventing nights", () => {
  const trip = {
    id: "trip", name: "Ready", template: "citytrip", start: "2026-10-01", end: "2026-10-03", budget: 0, expenses: [],
    stops: [{ id: "paris", name: "Paris", country: "France", lat: 48.8, lon: 2.3, arrive: "2026-10-01", nights: 2 }],
    itinerary: [{ id: "one", day: "2026-10-01", title: "Arrival" }, { id: "two", day: "2026-10-01", title: "Dinner" }],
    travelItems: [{ id: "hotel", type: "lodging", title: "Hotel", date: "2026-10-01", endDate: "2026-10-02" }],
    packing: [{ id: "passport", label: "Passport", done: true }, { id: "charger", label: "Charger", done: false }],
  } satisfies Trip;
  assert.deepEqual(getTripReadiness(trip), { stops: 1, tripDays: 3, plannedDays: 3, routeNights: 2, missingHotelNights: 1, packingTotal: 2, packingDone: 1 });
  const withoutNights = getTripReadiness({ ...trip, stops: [{ ...trip.stops[0], nights: undefined }], travelItems: [] });
  assert.equal(withoutNights.routeNights, 2);
  assert.equal(withoutNights.missingHotelNights, 2);
});

test("route stops and bookings count as scheduled trip days", () => {
  const trip = {
    id: "route", name: "Route", template: "roadtrip", start: "2026-10-01", end: "2026-10-04", budget: 0, expenses: [], itinerary: [],
    stops: [{ id: "a", name: "A", country: "NL", lat: 1, lon: 2, arrive: "2026-10-01", nights: 2 }],
    travelItems: [{ id: "car", type: "car_rental", title: "Car", date: "2026-10-03", endDate: "2026-10-04" }],
  } satisfies Trip;
  assert.equal(getTripReadiness(trip).plannedDays, 4);
});
