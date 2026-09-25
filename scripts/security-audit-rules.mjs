const SECRET_NAMES = /\b(?:SUPABASE_SERVICE_ROLE_KEY|SMTP_PASSWORD|PADDLE_API_KEY|MAIL_DELIVERY_RELAY_TOKEN|MAILBOX_CREDENTIALS_KEY|TURNSTILE_SECRET_KEY)\b/;
const SENSITIVE_LOG = /console\.(?:log|info|warn|error)\s*\([^\n]*(?:password|secret|token|authorization|cookie)/i;

export const reviewedPublicFunctions = new Set([
  "submitContact",
  "getTripInvitation",
  "getAgencyInvitation",
  "getPublicFeatureFlags",
  "getPublicTrip",
  "getPublicAgencyQuote",
  "respondToAgencyQuote",
]);

export const reviewedRawHtmlFiles = new Set([
  "src/components/ui/chart.tsx",
  "src/routes/__root.tsx",
  "src/routes/about.tsx",
  "src/routes/index.tsx",
  "src/routes/prijzen.tsx",
]);

// Public database functions are exceptional. Add a function here only after
// checking that it returns bounded, non-secret data and has a fixed search_path.
export const reviewedPublicDatabaseFunctions = new Set(["get_public_agency_host_branding"]);

export function auditTypeScriptSource(path, source) {
  const findings = [];
  const declarations = [...source.matchAll(/export const\s+(\w+)\s*=\s*createServerFn\b/g)];
  for (let index = 0; index < declarations.length; index += 1) {
    const declaration = declarations[index];
    const name = declaration[1];
    const block = source.slice(declaration.index, declarations[index + 1]?.index ?? source.length);
    if (
      block.includes("supabaseAdmin") &&
      !block.includes(".middleware([requireSupabaseAuth])") &&
      !reviewedPublicFunctions.has(name)
    ) {
      findings.push(`${path}: ${name} gebruikt supabaseAdmin zonder requireSupabaseAuth`);
    }
  }

  if (/^src\/(?:components|routes)\//.test(path) && SECRET_NAMES.test(source)) {
    findings.push(`${path}: servergeheim wordt vanuit browsercode benaderd`);
  }
  if (source.includes("dangerouslySetInnerHTML") && !reviewedRawHtmlFiles.has(path)) {
    findings.push(`${path}: nieuwe dangerouslySetInnerHTML-locatie vereist expliciete review`);
  }
  for (const anchor of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    if (!/rel=["'][^"']*noopener[^"']*["']/i.test(anchor[0])) {
      findings.push(`${path}: externe link met target=_blank mist rel=noopener`);
    }
  }
  if (SENSITIVE_LOG.test(source)) {
    findings.push(`${path}: mogelijk geheim of token wordt gelogd`);
  }
  return findings;
}

export function auditMigration(path, source) {
  const findings = [];
  const definerCount = (source.match(/SECURITY\s+DEFINER/gi) ?? []).length;
  const fixedSearchPathCount = (source.match(/SET\s+search_path\s*=\s*(?:''|pg_catalog)/gi) ?? []).length;
  if (fixedSearchPathCount < definerCount) {
    findings.push(
      `${path}: ${definerCount} SECURITY DEFINER-functie(s), maar slechts ${fixedSearchPathCount} vastgezette search_path(s)`,
    );
  }
  for (const grant of source.matchAll(
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+(?:public\.)?([a-z0-9_]+)\s*\([^;]*?\)\s+TO\s+(?:PUBLIC|anon|authenticated)\b/gi,
  )) {
    if (!reviewedPublicDatabaseFunctions.has(grant[1].toLowerCase())) {
      findings.push(
        `${path}: publieke databasefunctie ${grant[1]} vereist expliciete securityreview`,
      );
    }
  }
  return findings;
}
