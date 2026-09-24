export const PUBLIC_SITE_ORIGIN = "https://globetrotr.nl";
export const PORTAL_ORIGIN = "https://portal.globetrotr.nl";

const portalPaths = /^\/(?:auth|register|oauth-callback|complete-profile|session-bridge|token|dashboard|trips|account|billing|agency-admin|corporate-admin|company-mail|branding|team|analytics|client-portal|invite|uitnodiging|agency-invite|agency-uitnodiging)(?:\/|$)/;
const websitePaths = /^\/(?:demo|features|mogelijkheden|prijzen|pricing|about|for-groups|for-travelers|for-agencies|roadmap|updates|changelog|privacy|algemene-voorwaarden|terms|beta-voorwaarden|terugbetalingsbeleid|refund-policy|beta|known-issues|bekende-problemen|trip|reis|quote)(?:\/|$)/;

/** Keep application entry points on the portal without moving public links or secrets in the URL. */
export function canonicalSiteLocation(hostname: string, pathname: string, search = "", hash = "") {
  if (hostname === "globetrotr.nl" && portalPaths.test(pathname))
    return `${PORTAL_ORIGIN}${pathname}${search}${hash}`;
  if (hostname === "portal.globetrotr.nl" && pathname === "/")
    return `${PORTAL_ORIGIN}/dashboard${search}${hash}`;
  if (hostname === "portal.globetrotr.nl" && websitePaths.test(pathname))
    return `${PUBLIC_SITE_ORIGIN}${pathname}${search}${hash}`;
  if (!["globetrotr.nl", "www.globetrotr.nl", "portal.globetrotr.nl", "dashboard.globetrotr.nl"].includes(hostname) && pathname === "/")
    return `https://${hostname}/agency-admin${search}${hash}`;
  return null;
}

export function portalUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("PORTAL_PATH_REQUIRED");
  return `${PORTAL_ORIGIN}${path}`;
}

export function publicSiteUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("PUBLIC_SITE_PATH_REQUIRED");
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
