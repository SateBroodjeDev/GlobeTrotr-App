import assert from "node:assert/strict";
import test from "node:test";
import { safeInternalRedirect } from "./safe-redirect.ts";

test("interne redirects behouden pad, query en fragment", () => {
  assert.equal(safeInternalRedirect("/invite/abc?step=1#accept"), "/invite/abc?step=1#accept");
});

test("externe en dubbelzinnige redirects worden geweigerd", () => {
  for (const value of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%5cexample.com",
    "/%2fexample.com",
    "/dashboard\nhttps://example.com",
  ]) assert.equal(safeInternalRedirect(value), undefined, value);
});

test("te lange en niet-tekstuele redirects worden geweigerd", () => {
  assert.equal(safeInternalRedirect(`/${"a".repeat(500)}`), undefined);
  assert.equal(safeInternalRedirect(null), undefined);
});
