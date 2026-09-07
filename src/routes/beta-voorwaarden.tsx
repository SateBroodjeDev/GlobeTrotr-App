import { createFileRoute } from "@tanstack/react-router";
import { Beaker, CircleAlert, Handshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/beta-voorwaarden")({
  head: () => ({ meta: [{ title: "Beta-voorwaarden — GlobeTrotr" }, { name: "description", content: "Voorwaarden voor deelname aan de GlobeTrotr-beta." }] }),
  component: BetaTermsPage,
});

function BetaTermsPage() {
  const { text } = useLocale();
  const items = [
    { icon: Beaker, title: text("Testversie", "Test version"), body: text("GlobeTrotr is tijdens deze beta in ontwikkeling. Functies kunnen veranderen en tijdelijke fouten of onderbrekingen zijn mogelijk.", "GlobeTrotr remains under development during this beta. Features may change and temporary errors or interruptions may occur.") },
    { icon: CircleAlert, title: text("Controleer belangrijke gegevens", "Check important details"), body: text("GlobeTrotr verkoopt geen reizen en is geen boekingsdienst. Controleer tijden, prijzen, visa, verzekeringen en reserveringen altijd bij de officiële aanbieder voordat je vertrekt.", "GlobeTrotr does not sell travel and is not a booking service. Always verify times, prices, visas, insurance and reservations with the official provider before departure.") },
    { icon: Handshake, title: text("Zorgvuldig testen", "Responsible testing"), body: text("Gebruik de beta rechtmatig, deel geen toegang van anderen en meld fouten via het kanaal waarmee je bent uitgenodigd. Exporteer belangrijke reisgegevens als je daarvan zelf een kopie wilt bewaren.", "Use the beta lawfully, do not share other people's access and report issues through your invitation channel. Export important trip data if you want to keep your own copy.") },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="aurora rounded-3xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{text("Voorwaarden internationale beta", "International beta terms")}</h1>
        <p className="mt-3 text-sm opacity-90">{text("Geldig vanaf 7 september 2026 voor genodigde testers.", "Effective 7 September 2026 for invited testers.")}</p>
      </header>
      <div className="space-y-4">
        {items.map(({ icon: Icon, title, body }) => <Card key={title} className="surface"><CardContent className="flex gap-4 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p></div></CardContent></Card>)}
      </div>
    </div>
  );
}
