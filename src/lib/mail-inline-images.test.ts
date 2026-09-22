import assert from "node:assert/strict";
import test from "node:test";
import { resolveInlineMailImages } from "./mail-inline-images.ts";

test("resolves only matching inline image sources without changing links or text", () => {
  const html = '<p>cid:chart</p><a href="cid:chart">link</a><img src="cid:chart"><img src="cid:other">';
  const result = resolveInlineMailImages(html, [{ contentId: "<chart>", url: "https://example.test/image?a=1&b=2" }]);
  assert.match(result, /<img src="https:\/\/example\.test\/image\?a=1&amp;b=2">/);
  assert.match(result, /<img src="cid:other">/);
  assert.match(result, /<a href="cid:chart">/);
});
