import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { readPrivacyChoice } from "@/lib/privacy-consent";

export type AppLocale = "nl-NL" | "en-GB";

type LocaleContextValue = {
  locale: AppLocale;
  language: "nl" | "en";
  setLocale: (locale: AppLocale) => Promise<void>;
  text: (nl: string, en: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "globetrotr.locale";

function initialLocale(): AppLocale {
  if (typeof window === "undefined") return "nl-NL";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "nl-NL" || stored === "en-GB") return stored;
  return window.navigator.language.toLowerCase().startsWith("nl") ? "nl-NL" : "en-GB";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const saved = data?.locale === "en-GB" ? "en-GB" : "nl-NL";
        setLocaleState(saved);
        if (readPrivacyChoice()?.preferences) window.localStorage.setItem(STORAGE_KEY, saved);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = locale === "nl-NL" ? "nl" : "en";
    if (readPrivacyChoice()?.preferences) window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  async function setLocale(next: AppLocale) {
    setLocaleState(next);
    if (user) await supabase.from("profiles").upsert({ id: user.id, locale: next });
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        language: locale === "nl-NL" ? "nl" : "en",
        setLocale,
        text: (nl, en) => (locale === "nl-NL" ? nl : en),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
