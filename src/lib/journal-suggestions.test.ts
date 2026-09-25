import assert from "node:assert/strict";
import test from "node:test";
import { journalSuggestions } from "./journal-suggestions.ts";

test("journal suggestions only cover elapsed trip days without an entry", () => {
  const suggestions = journalSuggestions("2026-09-20", "2026-09-25", [
    { id: "a", name: "Utrecht", country: "NL", lat: 52, lon: 5, arrive: "2026-09-20", nights: 2 },
    { id: "b", name: "Gent", country: "BE", lat: 51, lon: 3, arrive: "2026-09-22", nights: 2 },
  ], ["2026-09-23"], "2026-09-24");
  assert.deepEqual(suggestions.map((item) => item.date), ["2026-09-24", "2026-09-22", "2026-09-21"]);
  assert.equal(suggestions[0]?.location, "Gent");
});

test("future trip days never prompt for a memory", () => {
  assert.deepEqual(journalSuggestions("2026-10-01", "2026-10-03", [], [], "2026-09-25"), []);
});
