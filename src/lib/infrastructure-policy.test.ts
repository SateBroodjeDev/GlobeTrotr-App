import assert from "node:assert/strict";
import test from "node:test";
import { isSafeObjectReference, providerDailyLimit, workerRetryDelaySeconds } from "./infrastructure-policy.ts";

test("betaalde plannen krijgen ruimere externe API-budgetten", () => {
  assert.ok(providerDailyLimit("pro", "weather") > providerDailyLimit("free", "weather"));
  assert.ok(providerDailyLimit("agency", "flight_lookup") > providerDailyLimit("pro", "flight_lookup"));
});

test("worker retries lopen begrensd op", () => {
  assert.equal(workerRetryDelaySeconds(1), 30);
  assert.equal(workerRetryDelaySeconds(4), 240);
  assert.equal(workerRetryDelaySeconds(99), 3_600);
});

test("opslagverwijzingen zijn provider-onafhankelijk en padveilig", () => {
  assert.equal(isSafeObjectReference({ provider: "supabase", bucket: "trip-documents", objectKey: "trip/file.pdf" }), true);
  assert.equal(isSafeObjectReference({ provider: "hetzner_s3", bucket: "trip-documents", objectKey: "../secret" }), false);
});
