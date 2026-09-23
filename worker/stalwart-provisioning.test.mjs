import assert from "node:assert/strict";
import test from "node:test";
import { accountLocalPart, accountProperties } from "./stalwart-provisioning.mjs";

test("builds a bounded Stalwart user account for a GlobeTrotr mailbox", () => {
  const account=accountProperties({address:"trip.sweden@globetrotr.nl",display_name:"Sweden trip",mailbox_type:"automated",active:true},"domain-1","secret");
  assert.equal(account.name,"trip.sweden");assert.equal(account.domainId,"domain-1");
  assert.equal(account.credentials["0"].secret,"secret");assert.equal(account.roles["@type"],"User");
});
test("refuses provisioning outside the platform domain",()=>assert.throws(()=>accountLocalPart("admin@example.com"),/MAIL_ADDRESS_INVALID/));
