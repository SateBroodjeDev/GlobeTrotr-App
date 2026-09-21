import assert from "node:assert/strict";
import test from "node:test";
import { safeImapErrorCode } from "./imap-diagnostics.mjs";

test("mailbox errors reveal a useful category without leaking server text", () => {
  assert.equal(safeImapErrorCode({ code: "AUTHENTICATIONFAILED", message: "bad password secret" }), "IMAP_AUTH_FAILED");
  assert.equal(safeImapErrorCode({ code: "ETIMEDOUT" }), "IMAP_TIMEOUT");
  assert.equal(safeImapErrorCode({ code: "REST_503" }), "IMAP_STORAGE_ERROR");
  assert.equal(safeImapErrorCode({ code: "MALWARE_SCANNER_UNAVAILABLE" }), "MALWARE_SCANNER_UNAVAILABLE");
  assert.equal(safeImapErrorCode({ message: "private mailbox content" }), "IMAP_SYNC_FAILED");
});
