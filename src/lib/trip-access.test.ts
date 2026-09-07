import assert from "node:assert/strict";
import test from "node:test";
import type { Trip } from "./types.ts";
import { protectTripUpdate } from "./trip-access.ts";

const current: Trip = {
  id: "trip-1", revision: "4", name: "Reis", template: "citytrip",
  start: "2026-09-07", end: "2026-09-08", budget: 100,
  stops: [], itinerary: [], expenses: [], members: [], public: false, archived: false,
};

test("finance can only submit expenses", () => {
  const submitted = {
    ...current, revision: "4", name: "Onbevoegd gewijzigd", public: true,
    expenses: [{ id: "e1", date: "2026-09-07", title: "Trein", category: "transport" as const, amount: 20, currency: "EUR", paidBy: "A", billable: false }],
  };
  const result = protectTripUpdate(current, submitted, "finance");
  assert.equal(result.name, current.name);
  assert.equal(result.public, false);
  assert.equal(result.expenses.length, 1);
});

test("planners cannot change members, publication or archive state", () => {
  const submitted = { ...current, name: "Nieuwe naam", public: true, archived: true, members: [{ id: "x", name: "X", email: "x@example.invalid", role: "viewer" as const, status: "active" as const, invitedAt: "2026-09-07" }] };
  const result = protectTripUpdate(current, submitted, "traveler");
  assert.equal(result.name, "Nieuwe naam");
  assert.equal(result.public, false);
  assert.equal(result.archived, false);
  assert.deepEqual(result.members, []);
});
