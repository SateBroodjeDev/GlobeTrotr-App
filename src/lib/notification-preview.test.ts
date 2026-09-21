import assert from "node:assert/strict";
import test from "node:test";
import { notificationPreview } from "./notification-preview.ts";

test("platform-pop-up gebruikt NL of EN inhoud zonder interne statuscode", () => {
  const item = { kind: "platform", title: "Storing", body: "status|critical|Service incident|Er is storing.|There is an incident.|123" };
  assert.deepEqual(notificationPreview(item, "nl"), { title: "Storing", description: "Er is storing." });
  assert.deepEqual(notificationPreview(item, "en"), { title: "Service incident", description: "There is an incident." });
});

test("abonnements-pop-up toont een leesbare zin", () => {
  assert.deepEqual(notificationPreview({ kind: "account", title: "Plan", body: "plan|pro" }, "en"), {
    title: "Subscription changed", description: "Your current plan is pro.",
  });
});
