import assert from "node:assert/strict";
import test from "node:test";
import { calculateTripStatistics } from "./trip-statistics.ts";
import type { Trip } from "./types.ts";

const trip = {
  id: "trip", name: "Test", template: "roadtrip", start: "2026-09-10", end: "2026-09-14", budget: 1_000,
  stops: [{ id: "1", name: "Utrecht", country: "Nederland", lat: 0, lon: 0, nights: 2 }, { id: "2", name: "Gent", country: "België", lat: 0, lon: 0, nights: 2 }],
  itinerary: [], expenses: [
    { id: "1", date: "2026-09-10", title: "Trein", category: "transport", amount: 100, currency: "EUR", paidBy: "a", billable: false },
    { id: "2", date: "2026-09-11", title: "Hotel", category: "lodging", amount: 200, currency: "USD", paidBy: "a", billable: false },
  ],
} satisfies Trip;

test("reisstatistieken berekenen budgettempo en categorieën in de basisvaluta", () => {
  const result = calculateTripStatistics(trip, (amount, currency) => currency === "USD" ? amount * 0.5 : amount, new Date("2026-09-11T12:00:00Z"));
  assert.equal(result.tripDays, 5);
  assert.equal(result.elapsedDays, 2);
  assert.equal(result.countries, 2);
  assert.equal(result.nights, 4);
  assert.equal(result.spent, 200);
  assert.equal(result.dailyAverage, 100);
  assert.equal(result.projectedTotal, 500);
  assert.deepEqual(result.categoryTotals.map(({ category, amount }) => [category, amount]), [["transport", 100], ["lodging", 100]]);
});

test("een toekomstige reis krijgt geen misleidende prognose", () => {
  const result = calculateTripStatistics(trip, (amount) => amount, new Date("2026-09-01T12:00:00Z"));
  assert.equal(result.elapsedDays, 0);
  assert.equal(result.dailyAverage, 0);
  assert.equal(result.projectedTotal, result.spent);
});
