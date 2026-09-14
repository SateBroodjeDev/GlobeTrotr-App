export const PRIVACY_CHOICE_KEY = "globetrotr.privacy-choice.v1";

export type PrivacyChoice = {
  version: 1;
  preferences: boolean;
  decidedAt: string;
};

export function readPrivacyChoice(): PrivacyChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(PRIVACY_CHOICE_KEY) ?? "null") as Partial<PrivacyChoice> | null;
    return value?.version === 1 && typeof value.preferences === "boolean" && typeof value.decidedAt === "string"
      ? (value as PrivacyChoice)
      : null;
  } catch {
    return null;
  }
}

export function savePrivacyChoice(preferences: boolean) {
  const choice: PrivacyChoice = { version: 1, preferences, decidedAt: new Date().toISOString() };
  window.localStorage.setItem(PRIVACY_CHOICE_KEY, JSON.stringify(choice));
  if (!preferences) window.localStorage.removeItem("globetrotr.locale");
  window.dispatchEvent(new CustomEvent("globetrotr:privacy-choice", { detail: choice }));
}

export function openPrivacyChoices() {
  window.dispatchEvent(new Event("globetrotr:open-privacy-choices"));
}
