import assert from "node:assert/strict";
import test from "node:test";
import { buildTripCalendar, buildTripGpx, csvCell, gpxRouteStops } from "./exporters.ts";
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
  } as unknown as Trip;
  const calendar = buildTripCalendar(trip);
  assert.match(calendar, /X-WR-CALNAME:Zweden\\, 2026/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20260602\r\nDTEND;VALUE=DATE:20260603/);
  assert.match(calendar, /SUMMARY:Museum\\; centrum/);
  assert.match(calendar, /DESCRIPTION:Neem pas mee\\nVertrek vroeg/);
  assert.match(calendar, /DTSTART:20260603T091500/);
  assert.match(calendar, /DTEND:20260603T114500/);
  assert.match(calendar, /LOCATION:Göteborg C/);
});

test("GPX-export bewaart de routevolgorde en escaped XML", () => {
  const gpx = buildTripGpx({ id: "route", name: "Route & reis", template: "roadtrip", start: "2026-06-01", end: "2026-06-10", budget: 0, itinerary: [], expenses: [], stops: [
    { id: "a", name: "A < B", country: "Nederland", lat: 52.1, lon: 5.1 },
    { id: "b", name: "Gent", country: "België", lat: 51.05, lon: 3.72 },
  ] });
  assert.match(gpx, /<name>Route &amp; reis<\/name>/);
  assert.ok(gpx.indexOf("A &lt; B") < gpx.indexOf("Gent"));
  assert.match(gpx, /rtept lat="52.1" lon="5.1"/);
});

test("GPX neemt alleen echte coördinaten binnen het wereldbereik mee", () => {
  const trip = {
    id: "route", name: "Test", stops: [
      { id: "null", name: "Zonder locatie", country: "", lat: null, lon: null },
      { id: "blank", name: "Leeg", country: "", lat: "", lon: "" },
      { id: "range", name: "Ongeldig", country: "", lat: 95, lon: 5 },
      { id: "zero", name: "Evenaar", country: "", lat: 0, lon: 0 },
    ],
  } as unknown as Trip;
  assert.deepEqual(gpxRouteStops(trip).map((stop) => stop.id), ["zero"]);
  const gpx = buildTripGpx(trip);
  assert.match(gpx, /rtept lat="0" lon="0"/);
  assert.doesNotMatch(gpx, /Zonder locatie|Ongeldig|Leeg/);
});

test("agenda-export geeft activiteiten zonder eindtijd een geldig uur en vouwt lange regels", () => {
  const trip = {
    id: "activity-trip", name: "Activiteiten", start: "2026-06-01", end: "2026-06-02",
    itinerary: [], expenses: [], stops: [],
    travelItems: [{ id: "activity-1", type: "activity", title: "Museum", date: "2026-06-01", details: { startTime: "13:30" }, notes: "Lange notitie ".repeat(15) }],
  } as unknown as Trip;
  const calendar = buildTripCalendar(trip);
  assert.match(calendar, /DTSTART:20260601T133000\r\nDTEND:20260601T143000/);
  assert.ok(calendar.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
});

test("agenda-export houdt verblijf en huurauto compact als hele-dagactiviteit", () => {
  const trip = {
    id: "all-day", name: "Roadtrip", start: "2026-06-01", end: "2026-06-05", itinerary: [], expenses: [], stops: [],
    travelItems: [
      { id: "car", type: "car_rental", title: "Rental car", date: "2026-06-01", endDate: "2026-06-03", details: { startTime: "10:30" } },
      { id: "hotel", type: "lodging", title: "Hotel", date: "2026-06-01", endDate: "2026-06-02", details: { startTime: "15:00" } },
    ],
  } as unknown as Trip;
  const calendar = buildTripCalendar(trip);
  assert.match(calendar, /UID:booking-car@globetrotr.nl[\s\S]*?DTSTART;VALUE=DATE:20260601\r\nDTEND;VALUE=DATE:20260604[\s\S]*?TRANSP:TRANSPARENT/);
  assert.match(calendar, /UID:booking-hotel@globetrotr.nl[\s\S]*?DTSTART;VALUE=DATE:20260601\r\nDTEND;VALUE=DATE:20260603/);
});
