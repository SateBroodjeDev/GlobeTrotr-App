import assert from "node:assert/strict";
import test from "node:test";
import { proposeRouteOrder } from "./route-optimizer.ts";

const stop = (id: string, name: string, lat: number, lon: number) => ({ id, name, country: "", lat, lon, nights: 0 });

test("route proposal keeps the first stop and shortens a crossed route", () => {
  const proposal = proposeRouteOrder([
    stop("a", "Start", 52.37, 4.9),
    stop("c", "Ver", 52.1, 6.1),
    stop("b", "Dichtbij", 52.3, 5.1),
    stop("d", "Einde", 52.0, 6.3),
  ]);
  assert.equal(proposal.proposed[0]?.id, "a");
  assert.equal(proposal.proposed[1]?.id, "b");
  assert.equal(proposal.changed, true);
  assert.ok(proposal.savedDistanceKm > 0);
});

test("two stops do not produce a misleading optimisation", () => {
  const proposal = proposeRouteOrder([stop("a", "A", 1, 1), stop("b", "B", 2, 2)]);
  assert.equal(proposal.changed, false);
  assert.equal(proposal.savedDistanceKm, 0);
});
