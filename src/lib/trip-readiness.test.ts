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
  assert.deepEqual(getTripReadiness(trip), { stops: 1, tripDays: 3, plannedDays: 1, routeNights: 2, missingHotelNights: 1, packingTotal: 2, packingDone: 1 });
  const withoutNights = getTripReadiness({ ...trip, stops: [{ ...trip.stops[0], nights: undefined }], travelItems: [] });
  assert.equal(withoutNights.routeNights, 0);
  assert.equal(withoutNights.missingHotelNights, 0);
});
