import assert from "node:assert/strict";
import test from "node:test";
import {
  findScheduledFlight,
  formatScheduleDate,
  isScheduleDateSupported,
} from "./flight-schedule.ts";

const now = new Date("2026-09-08T12:00:00Z");

test("Schedule-fallback gebruikt alleen het ondersteunde datumvenster", () => {
  assert.equal(isScheduleDateSupported("2026-09-03", now), true);
  assert.equal(isScheduleDateSupported("2026-09-09", now), true);
  assert.equal(isScheduleDateSupported("2026-09-02", now), false);
  assert.equal(isScheduleDateSupported("2026-09-10", now), false);
  assert.equal(isScheduleDateSupported("ongeldig", now), false);
});

test("Schedule-datum wordt naar het vereiste formaat omgezet", () => {
  assert.equal(formatScheduleDate("2026-09-08"), "08-09-2026");
  assert.equal(formatScheduleDate("2026-13-40"), undefined);
});

test("vluchtnummers uit de Schedule-response worden spatie-onafhankelijk gevonden", () => {
  const flight = findScheduledFlight(
    {
      flights: [
        { Flight: "BA 123", Time: "10:30" },
        { Flight: "KL456", Time: "11:45" },
      ],
    },
    "ba123",
  );
  assert.equal(flight?.Time, "10:30");
});
