import { createFileRoute } from "@tanstack/react-router";
import { Database, Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — GlobeTrotr" }, { name: "description", content: "Privacy-informatie voor de GlobeTrotr-beta." }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { text } = useLocale();
  const sections = [
    { icon: Database, title: text("Welke gegevens we gebruiken", "Data we use"), body: text("We verwerken je accountgegevens en de reisgegevens die je zelf invoert, zoals routes, reisgenoten, boekingsnotities en uitgaven. Functionele voorkeuren, zoals taal en weergave, worden ook bewaard.", "We process your account details and the trip data you enter, such as routes, fellow travellers, booking notes and expenses. Functional preferences such as language and appearance are also stored.") },
    { icon: Eye, title: text("Openbaar delen", "Public sharing"), body: text("Reizen zijn standaard privé. Alleen wanneer je openbaar delen inschakelt, kunnen mensen met de link de geselecteerde reisgegevens zien. Financiële totalen worden alleen getoond wanneer je dit afzonderlijk inschakelt.", "Trips are private by default. Only when you enable public sharing can people with the link view the selected trip data. Financial totals are shown only when you enable that separately.") },
    { icon: LockKeyhole, title: text("Toegang en bewaartermijn", "Access and retention"), body: text("Je account beveiligt je privégegevens. Je kunt openbare links uitschakelen en gegevens vanuit de app aanpassen of verwijderen. Beta-gegevens worden bewaard zolang je account actief is of zolang dit nodig is om de dienst en beveiliging te verzorgen.", "Your account protects your private data. You can disable public links and edit or remove data in the app. Beta data is kept while your account is active or while needed to operate and secure the service.") },
    { icon: ShieldCheck, title: text("Vragen en verzoeken", "Questions and requests"), body: text("Wil je gegevens inzien, corrigeren of laten verwijderen? Gebruik het contactkanaal waarmee je voor de beta bent uitgenodigd. Deel daarbij nooit je wachtwoord of volledige betaalgegevens.", "Want to access, correct or delete your data? Use the contact channel through which you were invited to the beta. Never share your password or full payment details.") },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="aurora rounded-3xl px-6 py-10 sm:px-10">
        <Badge variant="secondary" className="mb-4">{text("Beta-informatie", "Beta information")}</Badge>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{text("Privacy", "Privacy")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-90">{text("Zo gaat GlobeTrotr tijdens de internationale beta om met jouw gegevens. Laatst bijgewerkt op 7 september 2026.", "How GlobeTrotr handles your data during the international beta. Last updated 7 September 2026.")}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="surface"><CardContent className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </CardContent></Card>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{text("GlobeTrotr gebruikt in deze beta geen advertentie- of marketingcookies. Lokale opslag wordt alleen gebruikt voor functionele voorkeuren en de werking van de app.", "GlobeTrotr does not use advertising or marketing cookies in this beta. Local storage is used only for functional preferences and app operation.")}</p>
    </div>
  );
}
