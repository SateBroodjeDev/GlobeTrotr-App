import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Wallet } from "lucide-react";
import { getPublicTrip } from "@/lib/public.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reis/$token/$tripId")({
  head: () => ({
    meta: [
      { title: "Openbare reis — GlobeTrotr" },
      {
        name: "description",
        content: "Bekijk de route, dagplanning en bestemmingen van deze openbaar gedeelde reis.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Openbare reis — GlobeTrotr" },
      {
        property: "og:description",
        content: "Route, dagplanning en bestemmingen van een gedeelde GlobeTrotr-reis.",
      },
    ],
  }),
  component: PublicTrip,
});

function PublicTrip() {
  const { token, tripId } = Route.useParams();
  const q = useQuery({
    queryKey: ["public-trip", token, tripId],
    queryFn: () => getPublicTrip({ data: { token, tripId } }),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Reis laden…</p>;
  const trip = q.data;
  if (!trip) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Deze reis is niet (meer) openbaar</h1>
        <Button asChild variant="outline">
          <Link to="/">Terug naar home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-semibold">{trip.name}</h1>
        <p className="text-sm text-muted-foreground">
          {trip.start} → {trip.end} · gedeeld door {trip.brandName}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Bestemmingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {trip.stops.length === 0 && (
              <p className="text-muted-foreground">Geen bestemmingen gedeeld.</p>
            )}
            {trip.stops.map((s, i) => (
              <p key={`${s.name}-${i}`}>
                {s.name} <span className="text-muted-foreground">— {s.country}</span>
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" /> Dagplanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {trip.itinerary.length === 0 && (
              <p className="text-muted-foreground">Nog geen dagplanning gedeeld.</p>
            )}
            {trip.itinerary.map((d, i) => (
              <div key={`${d.day}-${i}`}>
                <p className="font-medium">
                  {d.day} · {d.title}
                </p>
                {d.notes && <p className="text-muted-foreground">{d.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {typeof trip.budget === "number" && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" /> Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {trip.currency} {trip.budget.toLocaleString("nl-NL")}
          </CardContent>
        </Card>
      )}

      <Card className="surface">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="text-sm">Zelf zo'n reis plannen en kosten eerlijk verdelen?</p>
          <Button asChild>
            <Link to="/auth">Gratis account maken</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
