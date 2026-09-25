import assert from "node:assert/strict";
import test from "node:test";
import { createStoredObjectKey, validateObjectUpload } from "./object-storage-policy.ts";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const tripId = "22222222-2222-4222-8222-222222222222";
const objectId = "33333333-3333-4333-8333-333333333333";

test("object uploads use bounded purpose-specific file rules", () => {
  assert.equal(validateObjectUpload("journal_photo", "image/webp", 1024).maxBytes, 5 * 1024 * 1024);
  assert.throws(() => validateObjectUpload("journal_photo", "image/svg+xml", 1024), /FILE_TYPE_NOT_ALLOWED/);
  assert.throws(() => validateObjectUpload("receipt", "application/pdf", 0), /FILE_SIZE_INVALID/);
});

test("object keys are opaque and scoped without retaining the original filename", () => {
  assert.equal(
    createStoredObjectKey({ purpose: "journal_photo", workspaceId, tripId, mimeType: "image/jpeg", id: objectId }),
    `journal_photo/${workspaceId}/${tripId}/${objectId}.jpg`,
  );
  assert.throws(
    () => createStoredObjectKey({ purpose: "receipt", workspaceId: "../admin", mimeType: "application/pdf" }),
    /SCOPE_INVALID/,
  );
});
