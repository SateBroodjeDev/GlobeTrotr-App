import assert from "node:assert/strict";
import test from "node:test";
import { inferMailAttachmentType, validMailAttachments } from "./mail-attachments.ts";

const valid = {
  fileName: "invoice.pdf",
  contentType: "application/pdf",
  sizeBytes: 1024,
  sha256: "a".repeat(64),
};

test("accepts bounded safe company-mail attachments", () => {
  assert.equal(validMailAttachments([valid]), true);
  assert.equal(inferMailAttachmentType({ name: "export.csv", type: "" }), "text/csv");
});

test("rejects excessive, unsupported and malformed attachments", () => {
  assert.equal(validMailAttachments(Array.from({ length: 6 }, () => valid)), false);
  assert.equal(validMailAttachments([{ ...valid, sizeBytes: 10 * 1024 * 1024 + 1 }]), false);
  assert.equal(validMailAttachments([{ ...valid, contentType: "application/x-msdownload" }]), false);
  assert.equal(validMailAttachments([{ ...valid, sha256: "not-a-hash" }]), false);
});
