import assert from "node:assert/strict";
import test from "node:test";
import { buildTripCalendar, csvCell } from "./exporters.ts";
import type { Trip } from "./types.ts";

test("CSV neutraliseert bekende spreadsheetformules", () => {
  for (const value of ["=1+1", "+SUM(A1:A2)", "-2+3", "@IMPORT", "  =cmd", "\t=cmd"]) {
    assert.equal(csvCell(value).startsWith("\"'"), true, value);
  }
});

test("CSV behoudt gewone tekst en escaped aanhalingstekens", () => {
  assert.equal(csvCell("Trein naar Oslo"), '"Trein naar Oslo"');
  assert.equal(csvCell('Hotel "Centrum"'), '"Hotel ""Centrum"""');
});

test("agenda-export bevat boekingen, dagplanning en veilig escaped tekst", () => {
  const trip = {
    id: "trip-1", name: "Zweden, 2026", start: "2026-06-01", end: "2026-06-10",
    itinerary: [{ id: "day-1", day: "2026-06-02", title: "Museum; centrum", notes: "Neem pas mee\nVertrek vroeg" }],
    travelItems: [{ id: "train-1", type: "transport", title: "Trein naar Oslo", date: "2026-06-03", endDate: "2026-06-03", details: { startTime: "09:15", endTime: "11:45" }, departure: { name: "Göteborg C", country: "SE", lat: 0, lon: 0 } }],
  } as Trip;
  const calendar = buildTripCalendar(trip);
  assert.match(calendar, /X-WR-CALNAME:Zweden\\, 2026/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20260602\r\nDTEND;VALUE=DATE:20260603/);
  assert.match(calendar, /SUMMARY:Museum\\; centrum/);
  assert.match(calendar, /DESCRIPTION:Neem pas mee\\nVertrek vroeg/);
  assert.match(calendar, /DTSTART:20260603T091500/);
  assert.match(calendar, /DTEND:20260603T114500/);
  assert.match(calendar, /LOCATION:Göteborg C/);
});
