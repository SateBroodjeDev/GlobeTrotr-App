import assert from "node:assert/strict";
import test from "node:test";
import { csvCell } from "./exporters.ts";

test("CSV neutraliseert bekende spreadsheetformules", () => {
  for (const value of ["=1+1", "+SUM(A1:A2)", "-2+3", "@IMPORT", "  =cmd", "\t=cmd"]) {
    assert.equal(csvCell(value).startsWith("\"'"), true, value);
  }
});

test("CSV behoudt gewone tekst en escaped aanhalingstekens", () => {
  assert.equal(csvCell("Trein naar Oslo"), '"Trein naar Oslo"');
  assert.equal(csvCell('Hotel "Centrum"'), '"Hotel ""Centrum"""');
});
