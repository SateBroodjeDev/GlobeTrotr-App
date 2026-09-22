const baseUrl = new URL(process.env.SMOKE_BASE_URL || "https://globetrotr.nl");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 12_000);

const checks = [
  ["Homepage", "/", "text/html"],
  ["Demo", "/demo", "text/html"],
  ["Prijzen", "/prijzen", "text/html"],
  ["About", "/about", "text/html"],
  ["Status", "/status", "text/html"],
  ["Contact", "/contact", "text/html"],
  ["Privacy", "/privacy", "text/html"],
  ["Voorwaarden", "/algemene-voorwaarden", "text/html"],
  ["Terugbetaling", "/terugbetalingsbeleid", "text/html"],
  ["Roadmap", "/roadmap", "text/html"],
  ["Updates", "/updates", "text/html"],
  ["Headerlogo", "/assets/brand/logo.png", "image/"],
  ["E-maillogo", "/assets/email/logo.png", "image/"],
];

if (!process.env.SMOKE_PORTAL_URL) {
  checks.splice(4, 0, ["Registreren", "/register", "text/html"], ["Inloggen", "/auth", "text/html"]);
}

async function inspect(label, path, expectedContentType, origin = baseUrl) {
  const url = new URL(path, origin);
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "GlobeTrotr-release-smoke/1.0" },
  });
  const contentType = response.headers.get("content-type") || "";
  const finalUrl = new URL(response.url);
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} (${url})`);
  if (finalUrl.origin !== origin.origin || normalisePath(finalUrl.pathname) !== normalisePath(path))
    throw new Error(`${label}: onverwachte redirect naar ${finalUrl}`);
  if (!contentType.toLowerCase().includes(expectedContentType))
    throw new Error(`${label}: onverwacht content-type ${contentType || "ontbreekt"}`);
  if (expectedContentType === "text/html") {
    const body = await response.text();
    if (!/globetrotr/i.test(body)) throw new Error(`${label}: GlobeTrotr ontbreekt in HTML`);
    if (body.length < 500) throw new Error(`${label}: HTML-respons is onverwacht klein`);
  } else {
    const body = await response.arrayBuffer();
    if (body.byteLength < 100) throw new Error(`${label}: bestand is leeg of onverwacht klein`);
  }
  return `${label}: ${response.status}`;
}

function normalisePath(value) {
  return value.length > 1 ? value.replace(/\/+$/, "") : value;
}

const failures = [];
for (const check of checks) {
  try {
    console.log(`✓ ${await inspect(...check)}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    console.error(`✗ ${failures.at(-1)}`);
  }
}

if (process.env.SMOKE_PORTAL_URL) {
  const portalOrigin = new URL(process.env.SMOKE_PORTAL_URL);
  for (const [label, path] of [["Portaal inloggen", "/auth"], ["Portaal registreren", "/register"], ["Portaal dashboard", "/dashboard"]]) {
    try {
      console.log(`âœ“ ${await inspect(label, path, "text/html", portalOrigin)}`);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      console.error(`âœ— ${failures.at(-1)}`);
    }
  }
}

if (process.env.SMOKE_WORKER_URL) {
  try {
    const response = await fetch(process.env.SMOKE_WORKER_URL, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "GlobeTrotr-release-smoke/1.0" },
    });
    const payload = await response.json();
    if (!response.ok || payload?.status !== "ok")
      throw new Error(`Worker health: HTTP ${response.status}`);
    console.log(`✓ Worker health: ${response.status}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    console.error(`✗ ${failures.at(-1)}`);
  }
}

if (failures.length) {
  console.error(`\nSmoketest mislukt: ${failures.length} controle(s) faalden.`);
  process.exit(1);
}
console.log(`\nSmoketest geslaagd: ${checks.length} publieke controles.`);
