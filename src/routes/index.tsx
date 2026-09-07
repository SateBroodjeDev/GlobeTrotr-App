import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe2, MapPin, ShieldCheck, Wallet, Users, ArrowRight } from "lucide-react";
import { listPublicTrips } from "@/lib/public.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";
import { LandingDemo } from "@/components/LandingDemo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobeTrotr — Reisplanner & kostenverdeler voor elke trip" },
      {
        name: "description",
        content:
          "Plan reizen wereldwijd, houd budget en uitgaven bij in elke valuta, verdeel kosten eerlijk en deel je reis openbaar. Maak gratis een account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "GlobeTrotr — Reisplanner & kostenverdeler" },
      {
        property: "og:description",
        content:
          "Multi-trip planner met live koersen, kaarten, paklijsten en eerlijke verrekening.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MapPin,
    title: ["Route & kaart", "Route & map"],
    copy: [
      "Bestemmingen zoeken wereldwijd, dag-voor-dag schema en navigatie per stop.",
      "Find destinations worldwide, create a daily itinerary and navigate each stop.",
    ],
  },
  {
    icon: Wallet,
    title: ["Budget & valuta", "Budget & currencies"],
    copy: [
      "Uitgaven in elke munt met live koersen, budget versus werkelijk.",
      "Track spending in any currency with current rates and budget comparisons.",
    ],
  },
  {
    icon: Users,
    title: ["Eerlijk verdelen", "Split fairly"],
    copy: [
      "Kosten 50/50 of per persoon, met het minimale aantal overboekingen.",
      "Split expenses equally or per person with fewer repayments.",
    ],
  },
  {
    icon: ShieldCheck,
    title: ["Privé per account", "Private by default"],
    copy: [
      "Je reizen staan veilig in je eigen account. Delen doe je alleen als je dat wilt.",
      "Your trips stay in your account and are only shared when you choose.",
    ],
  },
];

function Landing() {
  const { user } = useAuth();
  const { text } = useLocale();
  const publicTrips = useQuery({
    queryKey: ["public-trips"],
    queryFn: () => listPublicTrips(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-14">
      <section className="aurora relative grid items-center gap-10 overflow-hidden rounded-3xl px-5 py-10 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-16">
        <div className="min-w-0 max-w-2xl">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Globe2 className="size-3" /> globetrotr.nl
          </Badge>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            {text(
              "Grote plannen. Mooie herinneringen. Alles bij elkaar.",
              "Big plans. Great memories. All in one place.",
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm opacity-90 md:text-base">
            {text(
              "GlobeTrotr bundelt je route, dagplanning, paklijst en alle kosten in één overzicht — voor jezelf, je reisgenoten en je hele vriendengroep.",
              "GlobeTrotr brings your route, daily itinerary, packing list and expenses together for you and everyone travelling with you.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  {text("Naar mijn reizen", "View my trips")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">{text("Gratis account maken", "Create free account")}</Link>
                </Button>
              </>
            )}
            <Button asChild size="lg" variant="outline"><a href="#demo">{text("Ontdek de demo", "Explore the demo")} <ArrowRight className="size-4" /></a></Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">{text("Voor koppels, vrienden en families · Nederlands & English", "For couples, friends and families · Nederlands & English")}</p>
          <Link to="/beta-voorwaarden" className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-4">{text("Doe mee aan de internationale beta", "Join the international beta")}</Link>
        </div>
        <LandingDemo />
      </section>

      <section className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">{text("Meer voorpret, minder regelwerk", "More anticipation, less admin")}</p><h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{text("Van het eerste idee tot de laatste gedeelde rekening.", "From the first idea to the last shared bill.")}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{text("Je route in de groepsapp, boekingen in je mail en kosten in een spreadsheet? Geef je reis één plek waar iedereen het overzicht houdt.", "Your route in a group chat, bookings in your inbox and expenses in a spreadsheet? Give your trip one home where everyone can keep up.")}</p></section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title[0]} className="surface">
            <CardHeader className="pb-2">
              <f.icon className="size-5 text-primary" />
              <CardTitle className="text-base">{text(f.title[0], f.title[1])}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {text(f.copy[0], f.copy[1])}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border border-border bg-muted/20 p-6 sm:p-10 lg:grid-cols-[1fr_1.4fr]">
        <div><Badge variant="secondary">{text("Zo begint jouw avontuur", "Your adventure starts here")}</Badge><h2 className="mt-4 font-display text-3xl font-semibold">{text("Eén reis. Jullie verhaal.", "One trip. Your story.")}</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{text("Een weekend dichtbij of weken onderweg: bouw een planning die bij jullie past en neem hem mee op je telefoon.", "A weekend nearby or weeks on the road: build a plan that works for your group and take it with you on your phone.")}</p></div>
        <ol className="space-y-6">{[
          [text("Zet je droom op de kaart", "Put your dream on the map"),text("Kies je bestemmingen en voeg vluchten, verblijven en activiteiten toe aan de dagplanning.", "Choose destinations and add flights, stays and activities to your daily itinerary.")],
          [text("Neem je reisgenoten mee", "Bring your travel companions"),text("Werk samen met bestaande accounts. Bepaal wie mag plannen, kosten beheren of alleen kijken.", "Collaborate with existing accounts. Choose who can plan, manage expenses or just view.")],
          [text("Geniet, verdeel en deel", "Enjoy, split and share"),text("Vink je paklijst af, verdeel kosten en deel een openbaar reisverhaal met een eigen omschrijving en kaart.", "Tick off your packing list, split expenses and share a public travel story with your own introduction and map.")],
        ].map(([title,copy],i)=><li key={title} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">0{i+1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p></div></li>)}</ol>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {text("Openbare reizen", "Public trips")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {text(
                "Reizen die andere reizigers openbaar hebben gedeeld — laat je inspireren.",
                "Trips shared publicly by other travellers — find inspiration for your next journey.",
              )}
            </p>
          </div>
        </div>

        {publicTrips.isLoading ? (
          <p className="text-sm text-muted-foreground">{text("Reizen laden…", "Loading trips…")}</p>
        ) : publicTrips.isError ? (
          <p className="text-sm text-muted-foreground">{text("Openbare reizen konden niet worden geladen.", "Public trips could not be loaded.")} <button type="button" className="text-primary underline" onClick={() => void publicTrips.refetch()}>{text("Opnieuw proberen", "Try again")}</button></p>
        ) : (publicTrips.data ?? []).length === 0 ? (
          <Card className="surface">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {text(
                "Er zijn nog geen openbare reizen gedeeld. Maak een account en deel de jouwe als eerste.",
                "No public trips have been shared yet. Create an account and be the first to share yours.",
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(publicTrips.data ?? []).map((t) => (
              <Card key={`${t.token}-${t.tripId}`} className="surface flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="break-anywhere text-base">
                    <Link
                      to="/reis/$token/$tripId"
                      params={{ token: t.token, tripId: t.tripId }}
                      className="hover:underline"
                    >
                      {t.name}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t.start} → {t.end} · {text("door", "by")} {t.authorName}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-2 text-sm text-muted-foreground">
                  <p className="break-anywhere flex items-start gap-1">
                    <MapPin className="size-4 shrink-0" />
                    {t.stops
                      .map((s) => s.name)
                      .slice(0, 4)
                      .join(" · ") || text("Nog geen bestemmingen", "No destinations yet")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section className="aurora rounded-3xl p-8 text-center sm:p-12"><h2 className="font-display text-3xl font-semibold">{text("Waar gaan jullie naartoe?", "Where are you heading?")}</h2><p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{text("Begin met je eerste reis. Ontdek onderweg wat GlobeTrotr voor jullie kan doen, en help de beta beter te maken.", "Start with your first trip. Discover what GlobeTrotr can do for your group, and help shape the beta.")}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link to={user ? "/dashboard" : "/auth"}>{user ? text("Naar mijn reizen", "View my trips") : text("Begin gratis", "Start for free")}<ArrowRight className="size-4"/></Link></Button><Button asChild variant="outline" size="lg"><Link to="/changelog">{text("Bekijk de nieuwste updates", "See the latest updates")}</Link></Button></div></section>
    </div>
  );
}
