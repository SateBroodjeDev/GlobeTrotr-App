import test from "node:test";
import assert from "node:assert/strict";
import { createOfflineTripPack, findOfflineExpenseConflicts, mergeOfflineExpenses, summarizeOfflineTripPack } from "./offline-trip.ts";
import type { Expense, Trip } from "./types.ts";
import type { OfflineExpense } from "./offline-trip.ts";

test("offline packs retain practical details and exclude booking secrets and money", () => {
  const trip = {
    id: "trip-1", name: "Test trip", template: "citytrip", start: "2026-10-01", end: "2026-10-02", budget: 999,
    stops: [{ id: "stop-1", name: "Paris", country: "France", lat: 48.85, lon: 2.35 }],
    itinerary: [{ id: "plan-1", day: "2026-10-01", title: "Museum", notes: "Meet at the entrance" }],
    expenses: [{ id: "expense-1", date: "2026-10-01", title: "Hotel", category: "lodging", amount: 200, currency: "EUR", paidBy: "owner", billable: true }],
    travelItems: [{ id: "booking-1", type: "flight", title: "Flight", date: "2026-10-01", provider: "Airline", bookingReference: "SECRET123", amount: 500, currency: "EUR", notes: "private", flightNumber: "GT123", details: { startTime: "09:00" } }],
  } satisfies Trip;
  const pack = createOfflineTripPack(trip, "en-US");
  assert.equal(pack.travelItems[0]?.flightNumber, "GT123");
  assert.equal(pack.travelItems[0]?.startTime, "09:00");
  assert.doesNotMatch(JSON.stringify(pack), /SECRET123|private|999|500|200/);
  assert.equal(pack.locale, "en");
  const summary = summarizeOfflineTripPack(pack);
  assert.deepEqual({ stops: summary.stops, itineraryItems: summary.itineraryItems, bookings: summary.bookings, queuedExpenses: summary.queuedExpenses }, { stops: 1, itineraryItems: 1, bookings: 1, queuedExpenses: 0 });
  assert.ok(summary.bytes > 0);
});

test("offline expenses merge once without replacing current server data", () => {
  const existing = { id: "existing", date: "2026-10-01", title: "Train", category: "transport" as const, amount: 10, currency: "EUR", paidBy: "owner", billable: false };
  const queued = { ...existing, id: "queued", title: "Lunch" };
  const merged = mergeOfflineExpenses([existing], [queued, existing]);
  assert.deepEqual(merged.map((expense) => expense.id), ["existing", "queued"]);
  assert.equal(merged[0]?.title, "Train");
});

test("offline expense conflicts only flag changed records with the same id", () => {
  const base: OfflineExpense = { id: "same", date: "2026-10-01", title: "Lunch", amount: 20, currency: "EUR", paidBy: "a", category: "food", billable: false, queuedAt: "2026-10-01T12:00:00Z" };
  const { queuedAt: _queuedAt, ...serverExpense } = base;
  const current: Expense[] = [serverExpense];
  const queued: OfflineExpense[] = [
    { ...base, amount: 25 },
    { ...base, id: "new" },
  ];
  assert.deepEqual(findOfflineExpenseConflicts(current, queued), ["same"]);
});
