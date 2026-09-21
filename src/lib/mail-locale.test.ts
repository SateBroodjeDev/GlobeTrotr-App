import assert from "node:assert/strict";
import test from "node:test";
import { mailLocale } from "./mail-locale.ts";

test("mailtaal gebruikt alleen expliciet Nederlands en anders Engels", () => {
  assert.equal(mailLocale("nl-NL"), "nl");
  assert.equal(mailLocale("nl"), "nl");
  assert.equal(mailLocale("en-GB"), "en");
  assert.equal(mailLocale(undefined), "en");
  assert.equal(mailLocale(""), "en");
});
