import assert from "node:assert/strict";
import test from "node:test";
import { plainTextToMailHtml, sanitizeMailHtml } from "./safe-mail-html.ts";

test("keeps supported company-mail formatting", () => {
  assert.equal(
    sanitizeMailHtml(
      '<p>Hello <strong>world</strong><br><a href="https://globetrotr.nl/x?a=1&amp;b=2">Open</a></p>',
    ),
    '<p>Hello <strong>world</strong><br><a href="https://globetrotr.nl/x?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">Open</a></p>',
  );
});

test("removes scripts, event handlers and unsafe links", () => {
  assert.equal(
    sanitizeMailHtml(
      '<p onclick="bad()">Hi<script>alert(1)</script><a href="javascript:bad()">there</a></p>',
    ),
    "<p>Hi<a>there</a></p>",
  );
});

test("formats signatures without allowing HTML injection", () => {
  assert.equal(
    plainTextToMailHtml("Domenico <admin>\nGlobeTrotr\n\nhttps://globetrotr.nl"),
    "<p>Domenico &lt;admin&gt;<br>GlobeTrotr</p><p>https://globetrotr.nl</p>",
  );
});
