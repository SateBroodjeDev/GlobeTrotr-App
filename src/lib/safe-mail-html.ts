const allowedSimpleTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"]);

function safeHref(value: string) {
  const decoded = value.replace(/&amp;/gi, "&").trim();
  return /^(https?:|mailto:)/i.test(decoded) ? decoded : "";
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Keeps only the formatting subset offered by the company-mail editor. */
export function sanitizeMailHtml(input: string) {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .split(/(<[^>]*>)/g)
    .map((token) => {
      if (!token.startsWith("<")) return token;
      const closing = token.match(/^<\s*\/\s*([a-z0-9]+)\s*>$/i);
      if (closing) {
        const tag = closing[1].toLowerCase();
        return allowedSimpleTags.has(tag) || tag === "a" ? `</${tag}>` : "";
      }
      const opening = token.match(/^<\s*([a-z0-9]+)([\s\S]*?)>$/i);
      if (!opening) return "";
      const tag = opening[1].toLowerCase();
      if (allowedSimpleTags.has(tag)) return tag === "br" ? "<br>" : `<${tag}>`;
      if (tag !== "a") return "";
      const hrefMatch = opening[2].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = safeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "");
      return href
        ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
        : "<a>";
    })
    .join("")
    .trim();
}

export function plainTextToMailHtml(input: string) {
  const escaped = input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((part) => `<p>${part.replaceAll("\n", "<br>")}</p>`)
    .join("");
}
