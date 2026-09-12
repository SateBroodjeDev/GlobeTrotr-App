import assert from "node:assert/strict";
import test from "node:test";
import {
  balances,
  memberParticipantId,
  normalizeExpenseParticipants,
  ownerParticipantId,
  participantsOf,
  settle,
} from "./settle.ts";
import type { Trip } from "./types.ts";

const trip: Trip = {
  id: "trip-1",
  ownerId: "owner-1",
  name: "Groepsreis",
  template: "citytrip",
  start: "2026-09-08",
  end: "2026-09-09",
  budget: 100,
  stops: [],
  itinerary: [],
  members: [
    {
      id: "member-1",
      name: "Sam",
      email: "",
      role: "traveler",
      status: "active",
      invitedAt: "2026-09-08",
    },
    {
      id: "member-2",
      name: "Sam",
      email: "",
      role: "traveler",
      status: "active",
      invitedAt: "2026-09-08",
    },
  ],
  expenses: [
    {
      id: "expense-1",
      date: "2026-09-08",
      title: "Diner",
      category: "food",
      amount: 90,
      currency: "EUR",
      paidBy: memberParticipantId("member-2"),
      billable: false,
    },
  ],
};

test("gelijke namen blijven afzonderlijke deelnemers in de verrekening", () => {
  const participants = participantsOf(trip, {
    id: ownerParticipantId(trip.ownerId),
    name: "Eigenaar",
  });
  const result = balances(trip, participants, "EUR", { EUR: 1 });

  assert.equal(result.length, 3);
  assert.equal(result.find((item) => item.id === memberParticipantId("member-1"))?.net, -30);
  assert.equal(result.find((item) => item.id === memberParticipantId("member-2"))?.net, 60);
});

test("een vaste deelnemerssleutel blijft werken nadat de zichtbare naam wijzigt", () => {
  const renamed = {
    ...trip,
    members: trip.members?.map((member) =>
      member.id === "member-2" ? { ...member, name: "Alex" } : member,
    ),
  };
  const participants = participantsOf(renamed, {
    id: ownerParticipantId(renamed.ownerId),
    name: "Eigenaar",
  });
  const result = balances(renamed, participants, "EUR", { EUR: 1 });

  assert.equal(result.find((item) => item.id === memberParticipantId("member-2"))?.name, "Alex");
  assert.equal(result.find((item) => item.id === memberParticipantId("member-2"))?.net, 60);
});

test("oude naamwaarden worden bij bewerken naar een vaste sleutel omgezet", () => {
  const participants = participantsOf(trip, {
    id: ownerParticipantId(trip.ownerId),
    name: "Eigenaar",
  });
  const legacyExpense = { ...trip.expenses[0]!, paidBy: "Sam", splitWith: ["Sam"] };
  const normalized = normalizeExpenseParticipants(legacyExpense, participants);

  assert.equal(normalized.paidBy, memberParticipantId("member-1"));
  assert.deepEqual(normalized.splitWith, [memberParticipantId("member-1")]);
});

test("betaalverzoeken behouden de vaste deelnemerssleutels", () => {
  const result = settle([
    { id: "member:debtor", name: "Alex", paid: 0, owes: 25, net: -25 },
    { id: "owner:owner-1", name: "Sam", paid: 25, owes: 0, net: 25 },
  ]);
  assert.deepEqual(result, [{ from: "Alex", fromId: "member:debtor", to: "Sam", toId: "owner:owner-1", amount: 25 }]);
});
