import { useEffect, useState } from "react";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/lib/locale";
import { useAuth } from "@/lib/auth";
import { readPrivacyChoice, savePrivacyChoice } from "@/lib/privacy-consent";
import { publicSiteUrl } from "@/lib/site-routing";

export function PrivacyChoices() {
  const { text } = useLocale();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    const saved = readPrivacyChoice();
    setPreferences(saved?.preferences ?? false);
    setOpen(!saved && !user);
    const reopen = () => {
      setPreferences(readPrivacyChoice()?.preferences ?? false);
      setOpen(true);
    };
    window.addEventListener("globetrotr:open-privacy-choices", reopen);
    return () => window.removeEventListener("globetrotr:open-privacy-choices", reopen);
  }, [user]);

  if (!open) return null;
  const apply = (allowPreferences: boolean) => {
    savePrivacyChoice(allowPreferences);
    setOpen(false);
  };

  return (
    <section className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl sm:bottom-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="privacy-choice-title">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Cookie className="size-5" /></span>
        <div>
          <h2 id="privacy-choice-title" className="font-display text-lg font-semibold">{text("Jouw privacykeuze", "Your privacy choice")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text("GlobeTrotr gebruikt geen advertentie-, analyse- of gedragsprofileringcookies. Noodzakelijke browseropslag houdt je veilig ingelogd, bewaart een lokale herstelcache en beschermt formulieren tegen misbruik. Je kunt daarnaast toestaan dat we je taalvoorkeur onthouden.", "GlobeTrotr uses no advertising, analytics or behavioural-profiling cookies. Necessary browser storage keeps you securely signed in, stores a local recovery cache and protects forms against abuse. You can additionally allow us to remember your language preference.")}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-4 rounded-xl border p-3"><div><p className="flex items-center gap-1.5 text-sm font-medium"><ShieldCheck className="size-4 text-primary" />{text("Noodzakelijk", "Necessary")}</p><p className="mt-1 text-xs text-muted-foreground">{text("Inlogsessie, beveiliging, lokale herstelcache, basisweergave en je privacykeuze.", "Sign-in session, security, local recovery cache, basic appearance and your privacy choice.")}</p></div><span className="text-xs font-semibold text-primary">{text("Altijd aan", "Always on")}</span></div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3"><div><p className="text-sm font-medium">{text("Voorkeuren", "Preferences")}</p><p className="mt-1 text-xs text-muted-foreground">{text("Onthoud de gekozen taal op dit apparaat.", "Remember the selected language on this device.")}</p></div><Switch checked={preferences} onCheckedChange={setPreferences} aria-label={text("Voorkeursopslag toestaan", "Allow preference storage")} /></label>
      </div>
      <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{text("Een offline reispakket bewaar je alleen via de knop bij een reis. Browserpush activeer je apart via een browsertoestemming. Deze handelingen worden niet door de voorkeursschakelaar hierboven aangezet.", "You save an offline trip pack only through the button inside a trip. Browser push is enabled separately through browser permission. The preference switch above does not enable either feature.")}</div>
      <p className="mt-3 text-xs text-muted-foreground">{text("Er zijn geen analyse-, advertentie- of marketingtechnologieën actief. Lees de volledige uitleg op de", "No analytics, advertising or marketing technologies are active. Read the full explanation on the")} <a href={publicSiteUrl("/privacy#browseropslag")} className="underline underline-offset-2">{text("privacypagina", "privacy page")}</a>.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => apply(false)}>{text("Alleen noodzakelijk", "Necessary only")}</Button><Button type="button" className="min-h-11" onClick={() => apply(preferences)}>{text("Keuze opslaan", "Save choice")}</Button></div>
    </section>
  );
}
