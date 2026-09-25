import assert from "node:assert/strict";
import test from "node:test";
import { nearbyPlacesQuery } from "./nearby-places.ts";

test("nearby search uses bounded category filters and coordinates",()=>{
  const query=nearbyPlacesQuery("food",52.1,5.1);
  assert.match(query,/restaurant\|cafe/);
  assert.match(query,/around:5000,52\.1,5\.1/);
  assert.doesNotMatch(query,/hotel/);
});
