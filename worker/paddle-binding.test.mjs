import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { trustedPaddleCustomData, verifyCheckoutBinding } from "./paddle-binding.mjs";

const secret = "a-secret-value-with-more-than-32-characters";
const workspaceId = "bd3f3eb5-b0b4-4433-ae51-d88a1481e1d8";
function signed(claims) {
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}

test("checkout koppeling accepteert alleen een geldige handtekening, betaalwijze en plan", () => {
  const now = Date.UTC(2026, 8, 21);
  const token = signed({ w: workspaceId, p: "pro", m: "one_time", t: now });
  assert.equal(verifyCheckoutBinding(token, secret, "pro", "one_time"), workspaceId);
  assert.equal(verifyCheckoutBinding(token, secret, "agency", "one_time"), null);
  assert.equal(verifyCheckoutBinding(token, secret, "pro", "recurring"), null);
  const [body, signature] = token.split(".");
  assert.equal(verifyCheckoutBinding(`${body[0] === "a" ? "b" : "a"}${body.slice(1)}.${signature}`, secret, "pro", "one_time"), null);
});

test("Paddle-webhook verwijdert browser-workspace zonder geldige serverkoppeling", () => {
  const token = signed({ w: workspaceId, p: "pro", m: "recurring", t: Date.now() });
  const forged = trustedPaddleCustomData({ workspace_uuid: "victim", workspaceUuid: "victim" }, secret, "pro", "recurring");
  assert.equal(forged.workspace_uuid, undefined);
  assert.equal(forged.workspaceUuid, undefined);
  const valid = trustedPaddleCustomData({ checkout_binding: token, workspace_uuid: "victim" }, secret, "pro", "recurring");
  assert.equal(valid.workspace_uuid, workspaceId);
  assert.equal(trustedPaddleCustomData({ checkout_binding: token }, secret, "agency", "recurring").workspace_uuid, undefined);
});
