import assert from "node:assert/strict";
import test from "node:test";
import { parseBulkTripInvites, tripRoleAccess } from "./trip-member-bulk.ts";

test("bulk trip invitations validate roles and remove duplicate or existing email addresses", () => {
  const result = parseBulkTripInvites("Alice, alice@example.com, traveler\nBob; bob@example.com; viewer\nAgain, ALICE@example.com, viewer\nExisting, old@example.com, traveler\nWrong, wrong@example.com, finance", ["traveler", "viewer"], ["old@example.com"]);
  assert.deepEqual(result.invites.map(({ email, role }) => [email, role]), [["alice@example.com", "traveler"], ["bob@example.com", "viewer"]]);
  assert.deepEqual(result.issues.map(({ line, reason }) => [line, reason]), [[3, "duplicate"], [4, "existing"], [5, "role"]]);
});

test("trip role preview is deliberately bounded", () => {
  assert.deepEqual(tripRoleAccess("viewer"), ["view"]);
  assert.deepEqual(tripRoleAccess("traveler"), ["view", "plan", "expenses"]);
});
