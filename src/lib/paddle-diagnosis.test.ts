import assert from "node:assert/strict";
import test from "node:test";
import { classifyPaddleDiagnosis } from "./paddle-diagnosis.ts";

test("one-time payments require an actual, unexpired entitlement", () => {
  const base = { transactionStatus: "completed", webhookFailed: false, billingMode: "one_time", expectedPlan: "pro", workspacePlan: "free" };
  assert.equal(classifyPaddleDiagnosis(base), "missing_entitlement");
  assert.equal(classifyPaddleDiagnosis({ ...base, entitlementEndsAt: "2026-01-01T00:00:00Z" }, Date.parse("2026-02-01")), "entitlement_expired");
  assert.equal(classifyPaddleDiagnosis({ ...base, workspacePlan: "pro", entitlementEndsAt: "2027-01-01T00:00:00Z" }, Date.parse("2026-02-01")), "active");
});

test("recurring payments require an active subscription and matching workspace plan", () => {
  const base = { transactionStatus: "completed", webhookFailed: false, billingMode: "recurring", expectedPlan: "agency", workspacePlan: "free" };
  assert.equal(classifyPaddleDiagnosis(base), "subscription_missing");
  assert.equal(classifyPaddleDiagnosis({ ...base, subscriptionStatus: "active", subscriptionPlan: "agency" }), "workspace_mismatch");
  assert.equal(classifyPaddleDiagnosis({ ...base, workspacePlan: "agency", subscriptionStatus: "active", subscriptionPlan: "agency" }), "active");
  assert.equal(classifyPaddleDiagnosis({ ...base, webhookFailed: true }), "webhook_failed");
  assert.equal(classifyPaddleDiagnosis({ ...base, workspaceConflict: true }), "workspace_conflict");
});
