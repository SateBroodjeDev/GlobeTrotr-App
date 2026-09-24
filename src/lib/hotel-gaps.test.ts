import assert from "node:assert/strict";
import test from "node:test";
import { configuredRouteNights, findHotelGaps, findTripHotelGaps } from "./hotel-gaps.ts";

test("groups missing hotel nights per destination", () => {
  const gaps = findHotelGaps([
    { id: "paris", name: "Paris", country: "France", lat: 48.85, lon: 2.35, arrive: "2026-10-01", nights: 3 },
  ], [{ id: "hotel", type: "lodging", title: "Hotel", date: "2026-10-01", endDate: "2026-10-03" }]);
  assert.deepEqual(gaps.map(({ startDate, endDate, nights }) => ({ startDate, endDate, nights })), [
    { startDate: "2026-10-03", endDate: "2026-10-04", nights: 1 },
  ]);
});

test("a lodging without checkout covers one night", () => {
  assert.equal(findHotelGaps(
    [{ id: "x", name: "X", country: "Y", lat: 1, lon: 2, arrive: "2026-10-01", nights: 1 }],
    [{ id: "h", type: "lodging", title: "H", date: "2026-10-01" }],
  ).length, 0);
});

test("configured nights require both an arrival date and a positive duration", () => {
  assert.equal(configuredRouteNights([{ id: "x", name: "X", country: "Y", lat: 1, lon: 2, nights: 4 }]), 0);
  assert.equal(configuredRouteNights([{ id: "x", name: "X", country: "Y", lat: 1, lon: 2, arrive: "2026-10-01", nights: 4 }]), 4);
});

test("checks all trip nights and suggests the latest known route location", () => {
  const gaps = findTripHotelGaps({
    start: "2026-10-01", end: "2026-10-05",
    stops: [
      { id: "airport", name: "Airport", country: "NL", lat: 1, lon: 2, arrive: "2026-10-01", nights: 0 },
      { id: "paris", name: "Paris", country: "FR", lat: 3, lon: 4, arrive: "2026-10-02", nights: 2 },
    ],
    travelItems: [{ id: "hotel", type: "lodging", title: "Hotel", date: "2026-10-02", endDate: "2026-10-03" }],
  });
  assert.deepEqual(gaps, [
    { id: "2026-10-01:airport", startDate: "2026-10-01", endDate: "2026-10-02", nights: 1, suggestedStopId: "airport", confidence: "route" },
    { id: "2026-10-03:paris", startDate: "2026-10-03", endDate: "2026-10-04", nights: 1, suggestedStopId: "paris", confidence: "overnight" },
    { id: "2026-10-04:paris", startDate: "2026-10-04", endDate: "2026-10-05", nights: 1, suggestedStopId: "paris", confidence: "route" },
  ]);
});

test("asks for a location when a missing night has no dated route point", () => {
  assert.equal(findTripHotelGaps({ start: "2026-10-01", end: "2026-10-02", stops: [], travelItems: [] })[0]?.confidence, "unknown");
});
