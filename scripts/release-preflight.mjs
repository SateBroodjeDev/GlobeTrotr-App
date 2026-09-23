import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const implementationPath = join(root, "IMPLEMENTATION_PENDING.md");
const implementation = await readFile(implementationPath, "utf8");
const findings = [];

const migrationLinks = [
  ...implementation.matchAll(/supabase\/migrations\/(\d+_([a-z0-9_]+)\.sql)/g),
];
const testMatches = [...implementation.matchAll(/supabase\/tests\/([a-z0-9_]+\.sql)/g)];
const testLinks = new Set(testMatches.map((match) => match[1]));
const documentedMigrations = migrationLinks.map((match) => match[1]);
if (new Set(documentedMigrations).size !== documentedMigrations.length)
  findings.push("IMPLEMENTATION_PENDING bevat een migratie meer dan eenmaal");
if (new Set(testMatches.map((match) => match[1])).size !== testMatches.length)
  findings.push("IMPLEMENTATION_PENDING bevat een SQL-test meer dan eenmaal");
if (documentedMigrations.join("\n") !== [...documentedMigrations].sort().join("\n"))
  findings.push("Migraties staan niet in oplopende bestandsvolgorde in IMPLEMENTATION_PENDING");
for (let index = 0; index < migrationLinks.length; index += 1) {
  const match = migrationLinks[index];
  const [, filename, slug] = match;
  const testName = `${slug}.sql`;
  if (!(await exists(join(root, "supabase", "migrations", filename))))
    findings.push(`Migratie ontbreekt: ${filename}`);
  const linkedTest = testMatches.find((test) => test[1] === testName);
  if (!linkedTest || !(await exists(join(root, "supabase", "tests", testName))))
    findings.push(`SQL-test ontbreekt in bestand of handleiding: ${testName}`);
  const nextMigrationIndex = migrationLinks[index + 1]?.index ?? implementation.length;
  if (linkedTest && (linkedTest.index < match.index || linkedTest.index > nextMigrationIndex))
    findings.push(`SQL-test staat niet direct bij de juiste migratie: ${testName}`);
}

const migrations = (await readdir(join(root, "supabase", "migrations")))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const latest = migrations.at(-1);
const confirmedMatch = implementation.match(
  /<!--\s*release-preflight:\s*confirmed-through=(\d+_[a-z0-9_]+\.sql)\s*-->/,
);
const confirmedThrough = confirmedMatch?.[1];
if (!confirmedThrough || !migrations.includes(confirmedThrough))
  findings.push("IMPLEMENTATION_PENDING bevat geen geldige bevestigde migratiebaseline");
const pendingMigrations = confirmedThrough
  ? migrations.filter((name) => name > confirmedThrough)
  : migrations;
if (pendingMigrations.join("\n") !== documentedMigrations.join("\n"))
  findings.push(
    "IMPLEMENTATION_PENDING bevat niet exact alle migraties na de bevestigde baseline",
  );
if (latest && !implementation.includes(latest))
  findings.push(`Laatste migratie staat niet in IMPLEMENTATION_PENDING: ${latest}`);

const activeDocs = ["README.md", "IMPLEMENTATION_PENDING.md", "roadmap.md", "TEST_CHECKLIST.md"];
const retiredDocs = [
  "AGENCY_IMPLEMENTATION.md",
  "PADDLE_IMPLEMENTATION.md",
  "POST_COMMIT_DEPLOYMENT.md",
];
for (const file of activeDocs) {
  const source = await readFile(join(root, file), "utf8");
  for (const retired of retiredDocs) {
    if (source.includes(retired)) findings.push(`${file} verwijst nog naar verwijderd ${retired}`);
  }
}

for (const directory of ["src", "worker", "public", "supabase/templates"]) {
  for (const file of await files(join(root, directory))) {
    const source = await readFile(file, "utf8");
    if (/Â|Ã.|â(?:€|€¦)|ï¿½/.test(source))
      findings.push(`Mogelijk kapot UTF-8-teken in ${relative(root, file)}`);
  }
}

if (findings.length) {
  console.error("Release-preflight mislukt:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(
  `Release-preflight geslaagd: ${migrationLinks.length} migraties met tests, laatste ${basename(latest)}.`,
);

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? files(path) : [path];
    }),
  );
  return nested.flat().filter((path) => /\.(?:ts|tsx|js|mjs|html|md|txt)$/.test(path));
}
