import assert from "node:assert/strict";
import test from "node:test";
import { agencyDomainFilter, agencySubdomainForTls } from "./agency-domain.mjs";

test("only one registered-shape platform label can request Agency TLS", () => {
  assert.equal(agencySubdomainForTls("agency.globetrotr.nl"), "agency");
  assert.equal(agencySubdomainForTls("a.globetrotr.nl"), "a");
  for (const hostname of ["agency.example.nl", "a.b.globetrotr.nl", "-x.globetrotr.nl", "x-.globetrotr.nl", "a_globetrotr.nl", "www.globetrotr.nl.evil.test", "A.globetrotr.nl"]) {
    assert.equal(agencySubdomainForTls(hostname), null, hostname);
  }
});

test("Agency entry only resolves valid platform labels or verified custom domains", () => {
  assert.equal(agencyDomainFilter("firma.globetrotr.nl"), "subdomain=eq.firma");
  assert.equal(agencyDomainFilter("reizen.example.nl"), "custom_domain=eq.reizen.example.nl&verification_status=eq.verified");
  for (const hostname of ["A.globetrotr.nl", "-bad.example.nl", "bad.example.nl:443", "bad.example.nl/path", "a..example.nl", ""])
    assert.equal(agencyDomainFilter(hostname), null, hostname);
});
