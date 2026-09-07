import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, MapPin, Wallet } from "lucide-react";
import { getPublicTrip } from "@/lib/public.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

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
  const { user, loading: authLoading } = useAuth();
  const { token, tripId } = Route.useParams();
  const [pin, setPin] = useState("");
  const [submittedPin, setSubmittedPin] = useState<string | undefined>();
  const q = useQuery({
    queryKey: ["public-trip", token, tripId, submittedPin],
    queryFn: () => getPublicTrip({ data: { token, tripId, pin: submittedPin } }),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Reis laden…</p>;
  if (q.data?.status === "pin_required") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-2xl font-semibold">Deze reis is beveiligd</h1>
        <p className="text-sm text-muted-foreground">
          Vraag de 6- tot 12-cijferige PIN aan de eigenaar van deze reis.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedPin(pin);
          }}
        >
          <Input
            aria-label="PIN voor deze reis"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={6}
            maxLength={12}
            required
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            placeholder="PIN"
          />
          <Button type="submit">Openen</Button>
        </form>
      </div>
    );
  }

  if (q.data?.status !== "ok") {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Deze reis is niet (meer) openbaar</h1>
        <Button asChild variant="outline">
          <Link to="/">Terug naar home</Link>
        </Button>
      </div>
    );
  }

  const trip = q.data.trip;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-semibold">{trip.name}</h1>
        <p className="text-sm text-muted-foreground">
          {trip.start} → {trip.end} · gedeeld door {trip.authorName}
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
            {trip.stops.map((stop, index) => (
              <p key={stop.name + "-" + index}>
                {stop.name} <span className="text-muted-foreground">— {stop.country}</span>
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
            {trip.itinerary.map((day, index) => (
              <div key={day.day + "-" + index}>
                <p className="font-medium">
                  {day.day} · {day.title}
                </p>
                {day.notes && <p className="text-muted-foreground">{day.notes}</p>}
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

      {!authLoading && (
        <Card className="surface">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-6">
            <p className="text-sm">Zelf zo'n reis plannen en kosten eerlijk verdelen?</p>
            <Button asChild>
              {user ? (
                <Link to="/dashboard">Naar mijn reizen</Link>
              ) : (
                <Link to="/auth">Gratis account maken</Link>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
