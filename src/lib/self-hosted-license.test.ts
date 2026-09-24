import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";
import { sha256, signedLease, token, usable } from "./self-hosted-license-core.ts";

test("self-hosted tokens use distinct strong prefixes and hashes", () => {
  const license = token("gt_sh_"),
    installation = token("gti_");
  assert.match(license, /^gt_sh_[A-Za-z0-9_-]{40,}$/);
  assert.match(installation, /^gti_[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(sha256(license), sha256(installation));
  assert.match(sha256(license), /^[0-9a-f]{64}$/);
});

test("leases are Ed25519 signed and independently verifiable", () => {
  const pair = generateKeyPairSync("ed25519"),
    privatePem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    previous = process.env.SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY;
  process.env.SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY = Buffer.from(privatePem).toString("base64");
  try {
    const lease = signedLease({ licenseId: "license", exp: 12345 }),
      [, payload, signature] = lease.split(".");
    assert.equal(lease.split(".")[0], "gtlease1");
    assert.equal(
      verify(null, Buffer.from(payload), pair.publicKey, Buffer.from(signature, "base64url")),
      true,
    );
    assert.deepEqual(JSON.parse(Buffer.from(payload, "base64url").toString()), {
      licenseId: "license",
      exp: 12345,
    });
  } finally {
    if (previous === undefined) delete process.env.SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY;
    else process.env.SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY = previous;
  }
});

test("annual licences stop after expiry and grace while perpetual licences remain usable", () => {
  assert.equal(usable({ status: "active", license_type: "perpetual" }), true);
  assert.equal(
    usable({ status: "active", license_type: "annual", expires_at: "2000-01-01", grace_days: 14 }),
    false,
  );
  assert.equal(usable({ status: "suspended", license_type: "perpetual" }), false);
});
