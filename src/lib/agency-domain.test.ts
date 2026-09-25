import test from "node:test";
import assert from "node:assert/strict";
import { agencyHostLookup } from "./agency-domain.ts";

test("platform Agency subdomains use their registered label without external DNS verification", () => {
  assert.deepEqual(agencyHostLookup("noordreis.globetrotr.nl"), {
    host: "noordreis.globetrotr.nl",
    subdomain: "noordreis",
    customDomain: null,
    requiresVerification: false,
  });
});

test("custom Agency domains still require ownership verification", () => {
  assert.deepEqual(agencyHostLookup("reizen.example.nl"), {
    host: "reizen.example.nl",
    subdomain: null,
    customDomain: "reizen.example.nl",
    requiresVerification: true,
  });
});

test("platform and malformed hosts cannot become Agency tenants", () => {
  for (const host of ["portal.globetrotr.nl", "api.globetrotr.nl", "globetrotr.nl", "bad host"])
    assert.equal(agencyHostLookup(host), null);
});
