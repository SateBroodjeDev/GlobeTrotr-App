export const PRIVACY_CHOICE_KEY = "globetrotr.privacy-choice.v2";

export type PrivacyChoice = {
  version: 2;
  preferences: boolean;
  decidedAt: string;
};

export function readPrivacyChoice(): PrivacyChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(PRIVACY_CHOICE_KEY) ?? "null") as Partial<PrivacyChoice> | null;
    return value?.version === 2 && typeof value.preferences === "boolean" && typeof value.decidedAt === "string"
      ? (value as PrivacyChoice)
      : null;
  } catch {
    return null;
  }
}

export function savePrivacyChoice(preferences: boolean) {
  const choice: PrivacyChoice = { version: 2, preferences, decidedAt: new Date().toISOString() };
  window.localStorage.setItem(PRIVACY_CHOICE_KEY, JSON.stringify(choice));
  window.localStorage.removeItem("globetrotr.privacy-choice.v1");
  if (!preferences) window.localStorage.removeItem("globetrotr.locale");
  window.dispatchEvent(new CustomEvent("globetrotr:privacy-choice", { detail: choice }));
}

export function openPrivacyChoices() {
  window.dispatchEvent(new Event("globetrotr:open-privacy-choices"));
}
