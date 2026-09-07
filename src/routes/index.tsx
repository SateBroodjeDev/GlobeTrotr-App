import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe2, MapPin, ShieldCheck, Wallet, Users, ArrowRight } from "lucide-react";
import { listPublicTrips } from "@/lib/public.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";

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
      <section className="aurora relative overflow-hidden rounded-3xl px-6 py-14 md:px-12">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Globe2 className="size-3" /> globetrotr.nl
          </Badge>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            {text(
              "Plan elke reis. Verantwoord elke euro.",
              "Plan every trip. Account for every expense.",
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
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-foreground hover:text-accent-foreground"
                >
                  <Link to="/auth">{text("Inloggen", "Sign in")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

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
                  <p className="flex items-center gap-1">
                    <MapPin className="size-4" />
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
    </div>
  );
}
