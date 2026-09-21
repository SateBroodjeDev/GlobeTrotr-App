import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const templates = {
  "confirmation.html": "type=email",
  "recovery.html": "type=recovery",
  "email-change.html": "type=email_change",
  "magic-link.html": "type=email",
  "invite.html": "type=invite",
};

test("all Supabase Auth templates select one language and keep first-party token links", async () => {
  for (const [name, tokenType] of Object.entries(templates)) {
    const html = await readFile(new URL(`../supabase/templates/${name}`, import.meta.url), "utf8");
    assert.match(html, /if eq \.Data\.language "nl"/i, `${name} mist Nederlandse taalkeuze`);
    assert.match(html, /{{ else }}/i, `${name} mist Engelse standaardtaal`);
    assert.match(html, /{{ end }}/i, `${name} sluit taalkeuze niet af`);
    assert.ok(
      html.includes(`{{ .SiteURL }}/token/{{ .TokenHash }}?${tokenType}`),
      `${name} mist de eigen tokenroute`,
    );
    assert.ok(html.includes("/assets/email/logo.png"), `${name} mist het e-maillogo`);
    assert.doesNotMatch(html, />[^<]+ \/ [^<]+</, `${name} bevat nog tweetalige zichtbare tekst`);
  }
});

test("Auth email subjects use the same language metadata", async () => {
  const subjects = await readFile(
    new URL("../supabase/templates/subjects.md", import.meta.url),
    "utf8",
  );
  assert.equal((subjects.match(/if eq \.Data\.language "nl"/g) ?? []).length, 5);
  assert.equal((subjects.match(/{{ else }}/g) ?? []).length, 5);
});
