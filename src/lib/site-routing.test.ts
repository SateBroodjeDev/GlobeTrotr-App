import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSiteLocation, portalUrl, publicSiteUrl } from "./site-routing.ts";

test("account paths leave the marketing host without losing parameters", () => {
  assert.equal(
    canonicalSiteLocation("globetrotr.nl", "/auth", "?redirect=%2Fbilling"),
    "https://portal.globetrotr.nl/auth?redirect=%2Fbilling",
  );
  assert.equal(
    canonicalSiteLocation("globetrotr.nl", "/trips/123"),
    "https://portal.globetrotr.nl/trips/123",
  );
  assert.equal(
    canonicalSiteLocation("globetrotr.nl", "/token/abc", "?type=recovery"),
    "https://portal.globetrotr.nl/token/abc?type=recovery",
  );
  assert.equal(
    canonicalSiteLocation("globetrotr.nl", "/session-bridge"),
    "https://portal.globetrotr.nl/session-bridge",
  );
  assert.equal(canonicalSiteLocation("globetrotr.nl", "/trip/public/123"), null);
});

test("marketing paths leave the portal while contact and status stay available", () => {
  assert.equal(
    canonicalSiteLocation("portal.globetrotr.nl", "/"),
    "https://portal.globetrotr.nl/dashboard",
  );
  assert.equal(
    canonicalSiteLocation("portal.globetrotr.nl", "/demo"),
    "https://globetrotr.nl/demo",
  );
  assert.equal(canonicalSiteLocation("portal.globetrotr.nl", "/contact"), null);
  assert.equal(canonicalSiteLocation("portal.globetrotr.nl", "/status"), null);
  assert.equal(canonicalSiteLocation("localhost", "/auth"), null);
  assert.equal(portalUrl("/dashboard"), "https://portal.globetrotr.nl/dashboard");
  assert.equal(
    canonicalSiteLocation("agency.globetrotr.nl", "/"),
    "https://agency.globetrotr.nl/agency-admin",
  );
  assert.equal(
    canonicalSiteLocation("test.example.nl", "/"),
    "https://test.example.nl/agency-admin",
  );
  assert.equal(
    canonicalSiteLocation("test.example.nl", "/features"),
    "https://test.example.nl/agency-admin",
  );
  assert.equal(
    canonicalSiteLocation("test.example.nl", "/contact"),
    "https://test.example.nl/agency-admin",
  );
  assert.equal(
    canonicalSiteLocation("agency.globetrotr.nl", "/updates"),
    "https://agency.globetrotr.nl/agency-admin",
  );
  assert.equal(publicSiteUrl("/"), "https://globetrotr.nl/");
  assert.equal(publicSiteUrl("/roadmap"), "https://globetrotr.nl/roadmap");
  assert.throws(() => portalUrl("//evil.test"));
  assert.throws(() => publicSiteUrl("//evil.test"));
});
