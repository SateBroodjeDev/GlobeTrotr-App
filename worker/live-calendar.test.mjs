import test from "node:test";
import assert from "node:assert/strict";
import { buildLiveCalendar } from "./live-calendar.mjs";

test("live agenda bewaart activiteitstijden en een boeking zonder tijd blijft hele dag", () => {
  const body = buildLiveCalendar({
    name: "Zomer, 2026",
    itinerary: [{ id: "day", day: "2026-07-10", title: "Dagplan" }],
    bookings: [
      { id: "museum", start_date: "2026-07-10", title: "Museum", details: { startTime: "13:30" }, location: { name: "Centrum" } },
      { id: "hotel", start_date: "2026-07-11", end_date: "2026-07-12", title: "Hotel" },
    ],
  }, new Date("2026-07-01T12:00:00Z"));
  assert.match(body, /UID:booking-museum@globetrotr.nl\r\nDTSTAMP:20260701T120000Z\r\nDTSTART:20260710T133000\r\nDTEND:20260710T143000/);
  assert.match(body, /LOCATION:Centrum/);
  assert.match(body, /UID:booking-hotel@globetrotr.nl[\s\S]*?DTSTART;VALUE=DATE:20260711\r\nDTEND;VALUE=DATE:20260713/);
  assert.equal((body.match(/BEGIN:VEVENT/g) ?? []).length, 3);
});

test("live agenda ontsnapt invoer en weigert ongeldige datums", () => {
  const body = buildLiveCalendar({
    name: "Reis, zomer",
    itinerary: [{ id: "bad", day: "2026-02-31", title: "Ongeldig" }],
    bookings: [{ id: "good", start_date: "2026-07-10", title: "Museum; test\nInjected", notes: "Info, extra" }],
  });
  assert.match(body, /X-WR-CALNAME:Reis\\, zomer/);
  assert.match(body, /SUMMARY:Museum\\; test\\nInjected/);
  assert.match(body, /DESCRIPTION:Info\\, extra/);
  assert.doesNotMatch(body, /Ongeldig/);
  assert.ok(body.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
});
