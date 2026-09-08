import { createFileRoute, Link } from "@tanstack/react-router";
import { Beaker, Bug, CheckCircle2, CircleAlert, ClipboardCheck, Mail, Rocket, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { PUBLIC_BETA_STATUS } from "@/lib/public-changelog";

export const Route = createFileRoute("/beta-voorwaarden")({ head: () => ({ meta: [{ title: "Internationale beta — GlobeTrotr" }, { name: "description", content: "Alles over testen en deelnemen aan de GlobeTrotr-beta." }] }), component: BetaPage });

function BetaPage() {
  const { user } = useAuth();
  const { text } = useLocale();
  const journey = [
    [ClipboardCheck, text("1. Maak een echte testreis", "1. Create a real test trip"), text("Voeg bestemmingen, datums, planning en een paar uitgaven toe.", "Add destinations, dates, itinerary items and a few expenses.")],
    [ShieldCheck, text("2. Test samenwerken en delen", "2. Test collaboration and sharing"), text("Probeer een reisrol, openbare link en PIN zonder gevoelige echte gegevens.", "Try a trip role, public link and PIN without sensitive real data.")],
    [Bug, text("3. Meld wat schuurt", "3. Report friction"), text("Noem pagina, apparaat, taal, handeling en wat je verwachtte. Een schermafbeelding helpt.", "Include page, device, language, action and expected result. A screenshot helps.")],
  ] as const;
  const testAreas = [
    text("Reis maken en instellingen bewaren", "Create a trip and save settings"),
    text("Route, kaart en dagplanning", "Route, map and daily itinerary"),
    text("Vluchten, verblijf, vervoer en activiteiten", "Flights, accommodation, transport and activities"),
    text("Uitgaven, valuta en slimme verrekening", "Expenses, currencies and smart settlement"),
    text("Paklijst, exports en openbare reispagina", "Packing list, exports and public trip page"),
    text("Mobiele weergave en Nederlands/Engels", "Mobile layout and Dutch/English"),
  ];
  return <div className="mx-auto max-w-5xl space-y-10">
    <header className="aurora overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-16">
      <Badge variant="secondary" className="mb-4 gap-1.5"><Beaker className="size-3.5" /> {text("Internationale beta", "International beta")}</Badge>
      <h1 className="max-w-3xl font-display text-3xl font-semibold sm:text-5xl">{text("Help de reisplanner te bouwen die je zelf wilt meenemen", "Help build the trip planner you want to take with you")}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">{text("Test echte reissituaties, ontdek wat goed werkt en vertel ons waar je vastloopt. Je feedback bepaalt wat als volgende wordt verbeterd.", "Test real travel situations, discover what works well and tell us where you get stuck. Your feedback shapes what improves next.")}</p>
      <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link to={user ? "/dashboard" : "/auth"}><Rocket className="size-4" /> {user ? text("Start met testen", "Start testing") : text("Beta-account maken", "Create beta account")}</Link></Button><Button asChild size="lg" variant="outline"><Link to="/changelog">{text("Bekijk updates", "View updates")}</Link></Button></div>
    </header>

    <section><h2 className="font-display text-2xl font-semibold">{text("Een goede testronde in drie stappen", "A useful test round in three steps")}</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{journey.map(([Icon,title,body])=><Card key={title} className="surface"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></CardContent></Card>)}</div></section>

    <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <Card className="surface"><CardContent className="p-6 sm:p-8"><h2 className="font-display text-xl font-semibold">{text("Wat kun je testen?", "What can you test?")}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{testAreas.map(item=><div key={item} className="flex gap-2 rounded-xl bg-muted/40 p-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</div>)}</div></CardContent></Card>
      <Card className="surface border-amber-500/25"><CardContent className="p-6"><CircleAlert className="size-6 text-amber-600" /><h2 className="mt-4 font-display text-xl font-semibold">{text("Bewust nog niet beschikbaar", "Intentionally unavailable")}</h2><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{PUBLIC_BETA_STATUS.unavailable.map(item=><li key={item.nl} className="flex gap-2"><span aria-hidden>•</span>{text(item.nl,item.en)}</li>)}</ul></CardContent></Card>
    </section>

    <Card className="surface"><CardContent className="grid gap-6 p-6 sm:p-8 md:grid-cols-2"><div><h2 className="font-display text-xl font-semibold">{text("Test veilig en zorgvuldig", "Test safely and responsibly")}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text("GlobeTrotr is een testversie en kan veranderen of tijdelijk onderbroken zijn. Gebruik geen paspoortnummers, betaalkaartgegevens of medische informatie. Controleer tijden, prijzen, visa, verzekeringen en reserveringen altijd bij de officiële aanbieder; GlobeTrotr verkoopt geen reizen.", "GlobeTrotr is a test version and may change or be temporarily interrupted. Do not enter passport numbers, payment card details or medical information. Always verify times, prices, visas, insurance and reservations with the official provider; GlobeTrotr does not sell travel.")}</p></div><div><h2 className="font-display text-xl font-semibold">{text("Een bruikbare foutmelding", "A useful bug report")}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text("Stuur je melding via het kanaal waarmee je bent uitgenodigd. Beschrijf de laatste stappen, vermeld browser en apparaat en voeg alleen een schermafbeelding toe waarop geen privégegevens staan.", "Send your report through the channel used for your invitation. Describe the last steps, include browser and device, and only attach a screenshot that contains no private data.")}</p><p className="mt-4 flex items-center gap-2 text-sm font-medium"><Mail className="size-4 text-primary" /> {text("We bevestigen bekende problemen in de changelog.", "Known issues are acknowledged in the changelog.")}</p></div></CardContent></Card>
    <p className="text-xs leading-relaxed text-muted-foreground">{text("Door deel te nemen accepteer je dat dit een beta is. Je behoudt je AVG-rechten en kunt je gegevens exporteren of je account verwijderen. Geldig vanaf 8 september 2026.", "By participating, you accept that this is a beta. You retain your GDPR rights and can export your data or delete your account. Effective 8 September 2026.")}</p>
  </div>;
}
