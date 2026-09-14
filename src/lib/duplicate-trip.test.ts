import assert from "node:assert/strict";
import test from "node:test";
import { buildTripDuplicate, duplicateTripName } from "./duplicate-trip.ts";
import type { Trip } from "./types.ts";

test("reiskopienaam blijft binnen de databasegrens", () => {
  const name = duplicateTripName("Een bijzonder lange rondreisnaam", "kopie");
  assert.ok(name.length <= 30);
  assert.match(name, /\(kopie\)$/);
});

test("reiskopie bewaart planning maar verwijdert toegang en gevoelige boekingsdata", () => {
  let sequence = 0;
  const source = { id: "old", name: "Bron", template: "roadtrip", start: "2026-01-01", end: "2026-01-03", budget: 500, stops: [], itinerary: [{ id: "day", day: "2026-01-01", title: "Rijden", sourceTravelItemId: "booking" }], travelItems: [{ id: "booking", type: "lodging", title: "Hotel", date: "2026-01-01", bookingReference: "SECRET", expenseId: "expense" }], expenses: [{ id: "expense", date: "2026-01-01", title: "Hotel", category: "lodging", amount: 100, currency: "EUR", paidBy: "friend", billable: false }], members: [{ id: "member", name: "Vriend", email: "vriend@example.invalid", role: "traveler", status: "active", invitedAt: "2026-01-01" }], public: true, shareFinancials: true, sharePinHash: "hash" } satisfies Trip;
  const copy = buildTripDuplicate(source, { ...source, id: "new", revision: "1", expenses: [] }, () => `new-${++sequence}`);
  assert.equal(copy.id, "new");
  assert.equal(copy.travelItems?.[0]?.bookingReference, undefined);
  assert.equal(copy.itinerary[0]?.sourceTravelItemId, copy.travelItems?.[0]?.id);
  assert.deepEqual(copy.expenses, []);
  assert.deepEqual(copy.members, []);
  assert.equal(copy.public, false);
  assert.equal(copy.sharePinHash, undefined);
});
