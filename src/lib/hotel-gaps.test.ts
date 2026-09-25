import assert from "node:assert/strict";
import test from "node:test";
import { configuredRouteNights, createHotelGapBooking, findHotelGaps, findTripHotelGaps } from "./hotel-gaps.ts";

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
    { id: "2026-10-03:paris", startDate: "2026-10-03", endDate: "2026-10-05", nights: 2, suggestedStopId: "paris", confidence: "overnight" },
  ]);
});

test("groups consecutive missing nights at the same inferred location", () => {
  const gaps = findTripHotelGaps({
    start: "2026-11-01",
    end: "2026-11-05",
    stops: [{ id: "rome", name: "Rome", country: "IT", lat: 41.9, lon: 12.5, arrive: "2026-11-01", nights: 2 }],
    travelItems: [],
  });

  assert.deepEqual(gaps, [{
    id: "2026-11-01:rome",
    startDate: "2026-11-01",
    endDate: "2026-11-05",
    nights: 4,
    suggestedStopId: "rome",
    confidence: "overnight",
  }]);
});

test("asks for a location when a missing night has no dated route point", () => {
  assert.equal(findTripHotelGaps({ start: "2026-10-01", end: "2026-10-02", stops: [], travelItems: [] })[0]?.confidence, "unknown");
});

test("uses a dated booking arrival before asking for an overnight location", () => {
  const location = { name: "Rovaniemi", country: "Finland", lat: 66.5039, lon: 25.7294 };
  const gaps = findTripHotelGaps({
    start: "2026-12-01",
    end: "2026-12-03",
    stops: [{ id: "airport", name: "Schiphol", country: "Nederland", lat: 52.31, lon: 4.76 }],
    travelItems: [{
      id: "flight",
      type: "flight",
      title: "Flight to Rovaniemi",
      date: "2026-12-01",
      arrival: location,
    }],
  });

  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].confidence, "booking");
  assert.deepEqual(gaps[0].suggestedLocation, location);
  assert.equal(gaps[0].nights, 2);
});

test("turns a confirmed hotel result into a lodging that covers the complete gap", () => {
  const booking = createHotelGapBooking({
    id: "booking-1", name: "Hotel Roma", startDate: "2026-11-01", endDate: "2026-11-04",
    location: { name: "Rome", country: "IT", lat: 41.9, lon: 12.5 }, provider: "Hotel Roma",
    bookingReference: " ROMA-42 ", sourceUrl: "https://example.com/hotel",
    note: "Extern geboekt; gegevens gecontroleerd.",
  });
  assert.equal(booking.type, "lodging");
  assert.equal(booking.bookingReference, "ROMA-42");
  assert.equal(findTripHotelGaps({ start: "2026-11-01", end: "2026-11-04", stops: [], travelItems: [booking] }).length, 0);
});

test("rejects a hotel booking without a valid stay period", () => {
  assert.throws(() => createHotelGapBooking({
    id: "booking-1", name: "Hotel", startDate: "2026-11-04", endDate: "2026-11-04",
    location: { name: "Rome", country: "IT", lat: 41.9, lon: 12.5 }, note: "Checked",
  }), /INVALID_HOTEL_PERIOD/);
});
