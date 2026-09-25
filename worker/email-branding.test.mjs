import assert from "node:assert/strict";
import test from "node:test";
import { emailBranding, publicAgencyLogoUrl } from "./email-branding.mjs";

test("Agency mail branding never falls back to GlobeTrotr presentation", () => {
  const brand = emailBranding(
    {
      branding: {
        workspaceId: "11111111-1111-4111-8111-111111111111",
        brandName: "North Travel",
        tagline: "Travel your way",
        contactEmail: "HELLO@north.example",
        logoUrl: "https://project.supabase.co/storage/logo.png",
        accentHue: 210,
      },
    },
    "en",
  );
  assert.equal(brand.agency, true);
  assert.equal(brand.name, "North Travel");
  assert.equal(brand.contactEmail, "hello@north.example");
  assert.equal(brand.serviceNote, "This is a service message from North Travel.");
  assert.equal(JSON.stringify(brand).includes("GlobeTrotr"), false);
});

test("Agency logo paths become encoded public storage URLs", () => {
  assert.equal(
    publicAgencyLogoUrl("https://project.supabase.co/", "workspace/logo file.webp"),
    "https://project.supabase.co/storage/v1/object/public/agency-logos/workspace/logo%20file.webp",
  );
  assert.equal(publicAgencyLogoUrl("https://project.supabase.co", "../secret"), "");
});

test("Platform mail keeps the GlobeTrotr identity", () => {
  const brand = emailBranding({}, "nl");
  assert.equal(brand.agency, false);
  assert.equal(brand.name, "GlobeTrotr");
  assert.match(brand.logoUrl, /globetrotr\.nl/);
});
