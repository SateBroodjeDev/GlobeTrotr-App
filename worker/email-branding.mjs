function clean(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(clean(value, 2_000));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeEmail(value) {
  const email = clean(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function emailBranding(payload, locale = "en") {
  const source = payload?.branding && typeof payload.branding === "object" ? payload.branding : {};
  const agency = /^[0-9a-f-]{36}$/i.test(String(source.workspaceId || ""));
  const hue = Number(source.accentHue);
  const accent = Number.isFinite(hue)
    ? `hsl(${Math.min(360, Math.max(0, hue))} 70% 34%)`
    : "#168b78";

  if (!agency) {
    return {
      agency: false,
      name: "GlobeTrotr",
      tagline: "Plan every trip. Track every euro.",
      contactEmail: "",
      logoUrl: "https://globetrotr.nl/assets/email/logo.png",
      accent,
      serviceNote:
        locale === "en"
          ? "This is a service message from GlobeTrotr."
          : "Dit is een servicemelding van GlobeTrotr.",
    };
  }

  const name = clean(source.brandName, 100) || "Travel agency";
  return {
    agency: true,
    name,
    tagline: clean(source.tagline, 120),
    contactEmail: safeEmail(source.contactEmail),
    logoUrl: safeHttpsUrl(source.logoUrl),
    accent,
    serviceNote:
      locale === "en"
        ? `This is a service message from ${name}.`
        : `Dit is een servicemelding van ${name}.`,
  };
}

export function publicAgencyLogoUrl(supabaseUrl, logoPath) {
  const path = clean(logoPath, 300);
  if (!path || path.split("/").some((part) => !part || part === "." || part === "..")) return "";
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${String(supabaseUrl).replace(/\/$/, "")}/storage/v1/object/public/agency-logos/${encodedPath}`;
}
