import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, MapPin, Wallet, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { canEdit, planOf } from "@/lib/plans";
import {
  TEMPLATES,
  STATUS_LABEL,
  tripStatus,
  type TripStatus,
  type TripTemplate,
} from "@/lib/types";
import { convert, formatMoney } from "@/lib/services";
import { downloadJson } from "@/lib/exporters";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/locale";
import { localizeTagline } from "@/lib/localized-values";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Reizen — GlobeTrotr Multi-Trip Planner" },
      {
        name: "description",
        content:
          "Overzicht van al je reizen: budget, uitgaven in elke valuta en bestemmingen wereldwijd.",
      },
      { property: "og:title", content: "Reizen — GlobeTrotr Multi-Trip Planner" },
      {
        property: "og:description",
        content: "Beheer al je reizen, budgetten en declaraties op één plek.",
      },
    ],
  }),
  component: TripsOverview,
});

function TripsOverview() {
  const { state, addTrip, removeTrip, rates, ratesLive } = useWorkspace();
  const { locale, text } = useLocale();
  const navigate = useNavigate();
  const plan = planOf(state.plan);
  const editable = canEdit(state.role);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<TripTemplate>("citytrip");
  const [filter, setFilter] = useState<TripStatus | "all">("all");

  const atLimit = state.trips.length >= plan.tripLimit;
  const base = state.baseCurrency;

  const totals = state.trips.map((t) => ({
    id: t.id,
    spent: t.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
  }));
  const grand = totals.reduce((s, t) => s + t.spent, 0);

  const counts: Record<TripStatus, number> = { current: 0, upcoming: 0, archived: 0 };
  for (const t of state.trips) counts[tripStatus(t)] += 1;
  const visible = state.trips.filter((t) => filter === "all" || tripStatus(t) === filter);
  const nextTrip = state.trips
    .filter((t) => tripStatus(t) === "upcoming")
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  async function create() {
    if (!name.trim()) {
      toast.error(text("Geef de reis een naam", "Give your trip a name"));
      return;
    }
    if (atLimit) {
      toast.error(text(`Je ${plan.name}-plan staat ${plan.tripLimit} reizen toe. Upgrade naar Pro.`, `Your ${plan.name} plan allows ${plan.tripLimit} trips. Upgrade to Pro.`));
      return;
    }
    try {
      const id = await addTrip(name.trim(), template);
      setName("");
      toast.success(text("Reis aangemaakt", "Trip created"));
      navigate({ to: "/trips/$tripId", params: { tripId: id } });
    } catch {
      toast.error(text("De reis kon niet worden aangemaakt. Probeer het opnieuw.", "The trip could not be created. Please try again."));
    }
  }

  return (
    <div className="space-y-8">
      <section className="aurora relative overflow-hidden rounded-3xl px-6 py-10 md:px-10">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-3">
            {ratesLive ? text("Live ECB-koersen actief", "Live ECB rates active") : text("Fallback koersen", "Fallback rates")}
          </Badge>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            {localizeTagline(state.branding.tagline, locale)}
          </h1>
          <p className="mt-3 text-sm opacity-90">
            {text(`${state.trips.length} actieve reizen`, `${state.trips.length} active trips`)} · {formatMoney(grand, base)} {text("geboekte uitgaven", "recorded expenses")} · {text("wereldwijde geocoding, multi-valuta en live weer.", "global geocoding, multiple currencies and live weather.")}
          </p>
        </div>
      </section>

      <Card className="surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{text("Nieuwe reis vanuit sjabloon", "New trip from template")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  template === t.id
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="mr-1">{t.emoji}</span>
                {templateLabel(t.id, t.label, text)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              disabled={!editable}
              onChange={(e) => setName(e.target.value)}
              placeholder={text("Bijv. Namibië familie-safari", "For example, Namibia family safari")}
            />
            <Button onClick={create} disabled={!editable || atLimit}>
              <Plus className="size-4" /> {text("Reis aanmaken", "Create trip")}
            </Button>
          </div>
          {!editable && (
            <p className="text-sm text-muted-foreground">
              {text("Je huidige rol is alleen-lezen.", "Your current role is read-only.")}
            </p>
          )}
          {atLimit && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <Lock className="size-4" /> {text(`Limiet van ${plan.tripLimit} reizen bereikt op ${plan.name}.`, `${plan.name} limit of ${plan.tripLimit} trips reached.`)}{" "}
              <Link to="/billing" className="underline">
                Upgrade
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {nextTrip && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {text("Aftellen naar", "Countdown to")} {nextTrip.name} · {nextTrip.start}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Countdown date={nextTrip.start} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "current", "upcoming", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {f === "all" ? `${text("Alles", "All")} (${state.trips.length})` : `${statusLabel(f, text)} (${counts[f]})`}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            downloadJson(state, state.branding.brandName);
            toast.success(text("Back-up gedownload", "Backup downloaded"));
          }}
        >
          <Download className="size-4" /> JSON {text("back-up", "backup")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((trip) => {
          const spent = totals.find((t) => t.id === trip.id)!.spent;
          const pct = trip.budget ? Math.min(100, (spent / trip.budget) * 100) : 0;
          const tpl = TEMPLATES.find((t) => t.id === trip.template);
          return (
            <Card key={trip.id} className="surface flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link
                      to="/trips/$tripId"
                      params={{ tripId: trip.id }}
                      className="hover:underline"
                    >
                      {tpl?.emoji} {trip.name}
                    </Link>
                  </CardTitle>
                  {canEdit(state.role) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        try {
                          await removeTrip(trip.id);
                          toast.success(text("Reis verwijderd", "Trip deleted"));
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : text("Reis kon niet worden verwijderd.", "Trip could not be deleted."),
                          );
                        }
                      }}
                      aria-label={text("Reis verwijderen", "Delete trip")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{statusLabel(tripStatus(trip), text)}</Badge>
                  {trip.start} → {trip.end}
                  {tripStatus(trip) === "upcoming" && <Countdown date={trip.start} compact />}
                </p>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4" /> {trip.stops.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="size-4" /> {trip.expenses.length}
                  </span>
                </div>
                <Progress value={pct} />
                <p className="text-sm">
                  <span className="font-semibold">{formatMoney(spent, base)}</span>{" "}
                  <span className="text-muted-foreground">
                    {text("van", "of")} {formatMoney(trip.budget, base)}
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function statusLabel(status: TripStatus, text: (nl: string, en: string) => string) {
  return text(STATUS_LABEL[status], { current: "Current", upcoming: "Upcoming", archived: "Archived" }[status]);
}

function templateLabel(id: TripTemplate, fallback: string, text: (nl: string, en: string) => string) {
  const english: Record<TripTemplate, string> = { safari: "Safari", cruise: "Cruise", citytrip: "City trip", roadtrip: "Road trip", backpacking: "Backpacking", beach: "Beach holiday", winter: "Winter trip", business: "Business trip" };
  return text(fallback, english[id]);
}
