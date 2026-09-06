import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe2, MapPin, ShieldCheck, Wallet, Users, ArrowRight } from "lucide-react";
import { listPublicTrips } from "@/lib/public.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    title: "Route & kaart",
    text: "Bestemmingen zoeken wereldwijd, dag-voor-dag schema en navigatie per stop.",
  },
  {
    icon: Wallet,
    title: "Budget & valuta",
    text: "Uitgaven in elke munt met live koersen, budget versus werkelijk.",
  },
  {
    icon: Users,
    title: "Eerlijk verdelen",
    text: "Kosten 50/50 of per persoon, met het minimale aantal overboekingen.",
  },
  {
    icon: ShieldCheck,
    title: "Privé per account",
    text: "Je reizen staan veilig in je eigen account. Delen doe je alleen als je dat wilt.",
  },
];

function Landing() {
  const { user } = useAuth();
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
            Plan elke reis. Verantwoord elke euro.
          </h1>
          <p className="mt-4 max-w-xl text-sm opacity-90 md:text-base">
            GlobeTrotr bundelt je route, dagplanning, paklijst en alle kosten in één overzicht —
            voor jezelf, je reisgenoten en je hele vriendengroep.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Naar mijn reizen <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">Gratis account maken</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-foreground hover:text-accent-foreground"
                >
                  <Link to="/auth">Inloggen</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="surface">
            <CardHeader className="pb-2">
              <f.icon className="size-5 text-primary" />
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{f.text}</CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Openbare reizen</h2>
            <p className="text-sm text-muted-foreground">
              Reizen die andere reizigers openbaar hebben gedeeld — laat je inspireren.
            </p>
          </div>
        </div>

        {publicTrips.isLoading ? (
          <p className="text-sm text-muted-foreground">Reizen laden…</p>
        ) : (publicTrips.data ?? []).length === 0 ? (
          <Card className="surface">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Er zijn nog geen openbare reizen gedeeld. Maak een account en deel de jouwe als
              eerste.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(publicTrips.data ?? []).map((t) => (
              <Card key={`${t.token}-${t.tripId}`} className="surface flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link
                      to="/reis/$token/$tripId"
                      params={{ token: t.token, tripId: t.tripId }}
                      className="hover:underline"
                    >
                      {t.name}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t.start} → {t.end} · door {t.brandName}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <MapPin className="size-4" />
                    {t.stops
                      .map((s) => s.name)
                      .slice(0, 4)
                      .join(" · ") || "Nog geen bestemmingen"}
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
