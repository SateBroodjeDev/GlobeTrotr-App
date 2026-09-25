import assert from "node:assert/strict";
import test from "node:test";
import { auditMigration, auditTypeScriptSource } from "./security-audit-rules.mjs";

test("blocks unreviewed service-role functions without authentication", () => {
  const findings = auditTypeScriptSource(
    "src/lib/example.functions.ts",
    "export const unsafe = createServerFn({ method: 'GET' }).handler(async () => supabaseAdmin.from('users'))",
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0], /zonder requireSupabaseAuth/);
});

test("accepts authenticated service-role functions", () => {
  const findings = auditTypeScriptSource(
    "src/lib/example.functions.ts",
    "export const safe = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async () => supabaseAdmin.from('users'))",
  );
  assert.deepEqual(findings, []);
});

test("blocks secrets and unreviewed HTML sinks in browser code", () => {
  assert.equal(
    auditTypeScriptSource("src/routes/leak.tsx", "const key = SUPABASE_SERVICE_ROLE_KEY").length,
    1,
  );
  assert.equal(
    auditTypeScriptSource("src/components/Unsafe.tsx", "<div dangerouslySetInnerHTML={{__html: value}} />").length,
    1,
  );
});

test("requires noopener on links opening a new tab", () => {
  assert.equal(
    auditTypeScriptSource("src/routes/link.tsx", '<a href="https://example.com" target="_blank">x</a>').length,
    1,
  );
  assert.deepEqual(
    auditTypeScriptSource(
      "src/routes/link.tsx",
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>',
    ),
    [],
  );
});

test("requires a fixed search_path for every SECURITY DEFINER function", () => {
  assert.equal(
    auditMigration("migration.sql", "CREATE FUNCTION x() RETURNS void SECURITY DEFINER AS $$ $$;").length,
    1,
  );
  assert.deepEqual(
    auditMigration(
      "migration.sql",
      "CREATE FUNCTION x() RETURNS void SECURITY DEFINER SET search_path = '' AS $$ $$;",
    ),
    [],
  );
});

test("only explicitly reviewed database functions may be public", () => {
  assert.equal(
    auditMigration(
      "migration.sql",
      "GRANT EXECUTE ON FUNCTION public.unsafe(text) TO anon;",
    ).length,
    1,
  );
  assert.deepEqual(
    auditMigration(
      "migration.sql",
      "GRANT EXECUTE ON FUNCTION public.get_public_agency_host_branding(text) TO anon;",
    ),
    [],
  );
});
