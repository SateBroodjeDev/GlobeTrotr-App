import assert from "node:assert/strict";
import test from "node:test";
import type { Trip } from "./types.ts";
import { daysBetween, previewTripDateShift, shiftIsoDate, shiftTripDates } from "./trip-date-shift.ts";

const trip: Trip = {
  id: "trip",
  name: "Winterreis",
  template: "winter",
  start: "2026-03-28",
  end: "2026-04-02",
  budget: 1000,
  stops: [{ id: "stop", name: "Oslo", country: "NO", lat: 1, lon: 1, arrive: "2026-03-29", nights: 2 }],
  itinerary: [{ id: "plan", day: "2026-03-30", title: "Museum" }],
  travelItems: [{ id: "hotel", type: "lodging", title: "Hotel", date: "2026-03-29", endDate: "2026-03-31" }],
  travelOptions: [{ id: "candidate", type: "flight", title: "Vlucht", startDate: "2026-03-28", status: "candidate", checkedAt: "2026-02-01T12:00:00Z", createdAt: "2026-02-01T12:00:00Z" }],
  expenses: [{ id: "expense", date: "2026-02-01", title: "Aanbetaling", category: "lodging", amount: 50, currency: "EUR", paidBy: "owner", billable: false }],
};

test("calendar dates shift in UTC across daylight-saving boundaries", () => {
  assert.equal(daysBetween("2026-03-28", "2026-04-04"), 7);
  assert.equal(shiftIsoDate("2026-03-29", 7), "2026-04-05");
  const result = shiftTripDates(trip, "2026-04-04");
  assert.equal(result.end, "2026-04-09");
  assert.equal(result.stops[0]?.arrive, "2026-04-05");
  assert.equal(result.itinerary[0]?.day, "2026-04-06");
  assert.equal(result.travelItems?.[0]?.endDate, "2026-04-07");
  assert.equal(result.travelOptions?.[0]?.startDate, "2026-04-04");
});

test("historical expenses and comparison metadata do not move", () => {
  const result = shiftTripDates(trip, "2026-04-04");
  assert.equal(result.expenses[0]?.date, "2026-02-01");
  assert.equal(result.travelOptions?.[0]?.checkedAt, "2026-02-01T12:00:00Z");
  assert.equal(result.travelOptions?.[0]?.createdAt, "2026-02-01T12:00:00Z");
});

test("preview reports the exact impact before applying", () => {
  assert.deepEqual(previewTripDateShift(trip, "2026-03-21"), {
    days: -7,
    oldStart: "2026-03-28",
    oldEnd: "2026-04-02",
    newStart: "2026-03-21",
    newEnd: "2026-03-26",
    stops: 1,
    itineraryItems: 1,
    bookings: 1,
    candidates: 1,
  });
});

test("invalid target dates are rejected and malformed optional dates stay unchanged", () => {
  assert.throws(() => previewTripDateShift(trip, "2026-02-30"), /INVALID_TRIP_DATE/);
  assert.equal(shiftIsoDate("unknown", 3), "unknown");
});
