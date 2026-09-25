import assert from "node:assert/strict";
import test from "node:test";
import { validateAgencySmtp } from "./agency-smtp.mjs";

test("accepts bounded Agency SMTP configuration", () => {
  assert.equal(validateAgencySmtp({host:"smtp.example.com",port:587,secure:false,username:"agency@example.com",password:"secret",fromEmail:"agency@example.com"}).host, "smtp.example.com");
});

test("rejects local, incomplete and invalid Agency SMTP configuration", () => {
  assert.throws(() => validateAgencySmtp({host:"localhost",port:587,username:"x",password:"x",fromEmail:"x@example.com"}), /INVALID_AGENCY_SMTP/);
  assert.throws(() => validateAgencySmtp({host:"smtp.example.com",port:70000,username:"x",password:"x",fromEmail:"bad"}), /INVALID_AGENCY_SMTP/);
});
