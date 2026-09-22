import assert from "node:assert/strict";
import test from "node:test";
import { corporateSignatureHtml, corporateSignatureText, plainTextToMailHtml, sanitizeMailHtml } from "./safe-mail-html.ts";

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

test("builds a branded signature without duplicating legacy boilerplate", () => {
  const input = {
    displayName: "Domenico <Founder>",
    address: "info@globetrotr.nl",
    signatureText: "Domenico <Founder>\nFounder\nGlobeTrotr\nPlan every trip. Track every euro.\nhttps://globetrotr.nl",
  };
  const html = corporateSignatureHtml(input);
  assert.match(html, /assets\/email\/logo\.png/);
  assert.match(html, /Domenico &lt;Founder&gt;/);
  assert.match(html, /mailto:info@globetrotr\.nl/);
  assert.doesNotMatch(html, /Open GlobeTrotr|EU-first travel planning/);
  assert.match(html, /globetrotr\.nl\/contact/);
  assert.equal((html.match(/Plan every trip/g) || []).length, 1);
  assert.doesNotMatch(html, /<Founder>/);
  assert.equal(
    corporateSignatureText(input),
    "Domenico <Founder>\nFounder\nGlobeTrotr\nPlan every trip. Track every euro.\ninfo@globetrotr.nl\nhttps://globetrotr.nl\nContact: https://globetrotr.nl/contact",
  );
});
