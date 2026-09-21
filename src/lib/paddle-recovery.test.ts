import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { matchOneTimePaddlePrice, verifiedCheckoutWorkspace } from "./paddle-recovery.ts";

const secret = "a".repeat(64);
const workspace = "11111111-1111-4111-8111-111111111111";
const encoded = Buffer.from(JSON.stringify({ w: workspace, p: "agency", m: "one_time", t: Date.now() })).toString("base64url");
const token = `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;

test("a Paddle recovery requires the signed workspace, price and billing mode", () => {
  assert.equal(verifiedCheckoutWorkspace(token, secret, "agency", "one_time"), workspace);
  assert.equal(verifiedCheckoutWorkspace(token, secret, "pro", "one_time"), null);
  assert.equal(verifiedCheckoutWorkspace(token, secret, "agency", "recurring"), null);
  assert.equal(verifiedCheckoutWorkspace(token, "b".repeat(64), "agency", "one_time"), null);
  assert.equal(matchOneTimePaddlePrice([{ price: { id: "pri_agency" } }], { pro: "pri_pro", agency: "pri_agency" }), "agency");
  assert.equal(matchOneTimePaddlePrice([{ price: { id: "pri_other" } }], { pro: "pri_pro", agency: "pri_agency" }), null);
  assert.equal(matchOneTimePaddlePrice([{ price: { id: "pri_agency" } }, { price: { id: "pri_other" } }], { pro: "pri_pro", agency: "pri_agency" }), null);
});
