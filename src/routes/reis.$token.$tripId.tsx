import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  LockKeyhole,
  MapPin,
  Route as RouteIcon,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getPublicTrip } from "@/lib/public.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import TripMap from "@/components/TripMap";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES, type Stop } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { localizeCountry } from "@/lib/localized-values";

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
  const { locale, text } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const { token, tripId } = Route.useParams();
  const [pin, setPin] = useState("");
  const [submittedPin, setSubmittedPin] = useState<string | undefined>();
  const [activeStopId, setActiveStopId] = useState<string>();
  const [showAllStops, setShowAllStops] = useState(false);
  const q = useQuery({
    queryKey: ["public-trip", token, tripId, submittedPin],
    queryFn: () => getPublicTrip({ data: { token, tripId, pin: submittedPin } }),
  });

  if (q.isLoading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label={text("Reis laden", "Loading trip")}>
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }
  if (q.data?.status === "pin_required") {
    return (
      <Card className="surface mx-auto max-w-md overflow-hidden">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold">{text("Deze reis is beveiligd", "This trip is protected")}</h1>
            <p className="text-sm text-muted-foreground">
              {text("Vraag de 6- tot 12-cijferige pincode aan de eigenaar van deze reis.", "Ask the trip owner for the 6 to 12 digit PIN.")}
            </p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedPin(pin);
            }}
          >
            <Input
              aria-label={text("Pincode voor deze reis", "PIN for this trip")}
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
            <Button type="submit">{text("Openen", "Open")}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (q.data?.status !== "ok") {
    return (
      <Card className="surface mx-auto max-w-lg">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted">
            <MapPin className="size-6 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold">{text("Deze reis is niet (meer) openbaar", "This trip is no longer public")}</h1>
          <p className="text-sm text-muted-foreground">
            {text("De eigenaar heeft deze link mogelijk uitgeschakeld.", "The owner may have disabled this link.")}
          </p>
          <Button asChild variant="outline">
            <Link to="/">{text("Terug naar home", "Back home")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const trip = q.data.trip;
  const template = TEMPLATES.find((item) => item.id === trip.template);
  const stops: Stop[] = trip.stops.map((stop, index) => ({ ...stop, id: `public-stop-${index}` }));
  const groupedDays = (() => {
    const days = new Map<string, typeof trip.itinerary>();
    for (const item of trip.itinerary) days.set(item.day, [...(days.get(item.day) ?? []), item]);
    return [...days.entries()];
  })();
  const dateRange = formatDateRange(trip.start, trip.end, locale);
  const visibleStops = showAllStops ? stops : stops.slice(0, 4);
  const countryCount = new Set(stops.map((stop) => stop.country).filter(Boolean)).size;
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="aurora relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <Sparkles className="size-3" /> {text("Openbaar reisverhaal", "Public travel story")}
          </Badge>
          <div className="flex items-start gap-4">
            <span className="text-4xl sm:text-5xl" aria-hidden>
              {template?.emoji ?? "🌍"}
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
                {trip.name}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm opacity-90 sm:text-base">
                <CalendarDays className="size-4" /> {dateRange}
                <span aria-hidden>·</span> {text("gedeeld door", "shared by")} {trip.authorName}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">
            {trip.description ||
              (stops.length
                ? text(`Een reis langs ${stops.length} ${stops.length === 1 ? "bestemming" : "bestemmingen"}${countryCount ? ` in ${countryCount} ${countryCount === 1 ? "land" : "landen"}` : ""}.`, `A trip across ${stops.length} ${stops.length === 1 ? "destination" : "destinations"}${countryCount ? ` in ${countryCount} ${countryCount === 1 ? "country" : "countries"}` : ""}.`)
                : text("De route en dagplanning van deze reis worden hier gedeeld.", "The route and daily itinerary for this trip are shared here."))}
          </p>
        </div>
      </header>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <Card className="surface min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon className="size-4 text-primary" /> {text("De route", "The route")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
            {stops.length > 0 ? (
              <TripMap stops={stops} activeStopId={activeStopId} onStopSelect={setActiveStopId} />
            ) : (
              <div className="grid h-72 place-items-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
                {text("Nog geen bestemmingen gedeeld.", "No destinations shared yet.")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface min-w-0 self-start">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-primary" /> {text("Bestemmingen", "Destinations")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stops.length === 0 && (
              <p className="text-sm text-muted-foreground">{text("De route is nog leeg.", "The route is empty.")}</p>
            )}
            {visibleStops.map((stop) => {
              const index = stops.findIndex((item) => item.id === stop.id);
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => setActiveStopId(stop.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${activeStopId === stop.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{stop.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[
                        localizeCountry(stop.country, locale),
                        stop.arrive ? formatDate(stop.arrive, locale) : "",
                        stop.nights
                          ? `${stop.nights} ${text(stop.nights === 1 ? "nacht" : "nachten", stop.nights === 1 ? "night" : "nights")}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
              );
            })}
            {stops.length > 4 && (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setShowAllStops((current) => !current)}
              >
                {showAllStops ? text("Minder bestemmingen", "Fewer destinations") : text(`Alle ${stops.length} bestemmingen`, `All ${stops.length} destinations`)}
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {text("Van dag tot dag", "Day by day")}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{text("Dagplanning", "Itinerary")}</h2>
        </div>
        {groupedDays.length === 0 ? (
          <Card className="surface">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {text("Nog geen dagplanning gedeeld.", "No itinerary shared yet.")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupedDays.map(([day, items], dayIndex) => (
              <Card key={day} className="surface overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/30 pb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {text("Dag", "Day")} {dayIndex + 1}
                  </p>
                  <CardTitle className="text-base">{formatDate(day, locale)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {items.map((item, index) => (
                    <div
                      key={`${item.day}-${index}`}
                      className="relative border-l-2 border-primary/30 pl-4"
                    >
                      <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.notes && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {typeof trip.budget === "number" && (
        <Card className="surface overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4 text-primary" /> {text("Gedeeld reisbudget", "Shared trip budget")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text("De eigenaar heeft alleen het totaalbudget openbaar gemaakt.", "The owner has only made the total budget public.")}
              </p>
            </div>
            <p className="font-display text-2xl font-semibold">
              {formatMoney(trip.budget, trip.currency, locale)}
            </p>
          </CardContent>
        </Card>
      )}

      {!authLoading && (
        <Card className="surface overflow-hidden">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-xl font-semibold">{text("Klaar voor je eigen avontuur?", "Ready for your own adventure?")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {text("Plan je route, dagprogramma en gezamenlijke kosten op één plek.", "Plan your route, itinerary and shared expenses in one place.")}
              </p>
            </div>
            <Button asChild>
              {user ? (
                <Link to="/dashboard">
                  {text("Naar mijn reizen", "View my trips")} <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link to="/auth">
                  {text("Gratis account maken", "Create free account")} <ArrowRight className="size-4" />
                </Link>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(value: string, locale: "nl-NL" | "en-GB") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateRange(start: string, end: string, locale: "nl-NL" | "en-GB") {
  if (!start && !end) return locale === "nl-NL" ? "Reisdata nog niet bekend" : "Travel dates not available yet";
  if (start === end || !end) return formatDate(start, locale);
  return `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
}

function formatMoney(amount: number, currency = "EUR", locale: "nl-NL" | "en-GB") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
