export type MailLocale = "nl" | "en";

/** English is the safe default until a user explicitly selected Dutch. */
export function mailLocale(value: unknown): MailLocale {
  return String(value ?? "")
    .toLowerCase()
    .startsWith("nl")
    ? "nl"
    : "en";
}
