import assert from "node:assert/strict";
import { test } from "node:test";
import { createJournalSummaryDraft } from "./journal-summary.ts";
test("summary draft uses selected entries in chronological order", () => {
  const result = createJournalSummaryDraft([{ id:"2",date:"2026-02-02",title:"Snow",body:"A long walk.",location:"Kiruna" },{ id:"1",date:"2026-02-01",title:"Arrival",body:"We arrived.",location:"Luleå" }],"en");
  assert.ok(result.indexOf("Arrival") < result.indexOf("Snow")); assert.match(result,/Luleå, Kiruna/);
});
test("empty selection never invents a summary",()=>assert.equal(createJournalSummaryDraft([],"nl"),""));
