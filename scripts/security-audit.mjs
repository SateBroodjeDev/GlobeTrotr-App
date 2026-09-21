import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { auditMigration, auditTypeScriptSource } from "./security-audit-rules.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const migrationRoot = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? files(path) : [path];
    }),
  );
  return nested.flat();
}

const findings = [];
for (const file of (await files(sourceRoot)).filter((path) => /\.tsx?$/.test(path))) {
  const source = await readFile(file, "utf8");
  const path = relative(root, file).replaceAll("\\", "/");
  findings.push(...auditTypeScriptSource(path, source));
}

for (const file of (await files(migrationRoot)).filter((path) => {
  const name = path.split(/[\\/]/).at(-1) ?? "";
  return /^\d+_.+\.sql$/.test(name) && name > "20260908117000_payment_modes_and_live_calendars.sql";
})) {
  const source = await readFile(file, "utf8");
  const path = relative(root, file).replaceAll("\\", "/");
  findings.push(...auditMigration(path, source));
}

if (findings.length) {
  console.error("Beveiligingsaudit mislukt:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(
  "Beveiligingsaudit geslaagd: serverfuncties, browsergeheimen, HTML-sinks, externe links, logging en nieuwe SECURITY DEFINER-functies gecontroleerd.",
);
