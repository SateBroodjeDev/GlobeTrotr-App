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
      toast.error("Geef de reis een naam");
      return;
    }
    if (atLimit) {
      toast.error(`Je ${plan.name}-plan staat ${plan.tripLimit} reizen toe. Upgrade naar Pro.`);
      return;
    }
    try {
      const id = await addTrip(name.trim(), template);
      setName("");
      toast.success("Reis aangemaakt");
      navigate({ to: "/trips/$tripId", params: { tripId: id } });
    } catch {
      toast.error("De reis kon niet in de database worden aangemaakt. Probeer het opnieuw.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="aurora relative overflow-hidden rounded-3xl px-6 py-10 md:px-10">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-3">
            {ratesLive ? "Live ECB-koersen actief" : "Fallback koersen"}
          </Badge>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            {state.branding.tagline}
          </h1>
          <p className="mt-3 text-sm opacity-90">
            {state.trips.length} actieve reizen · {formatMoney(grand, base)} geboekte uitgaven ·
            wereldwijde geocoding, multi-valuta en live weer.
          </p>
        </div>
      </section>

      <Card className="surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nieuwe reis vanuit sjabloon</CardTitle>
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
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              disabled={!editable}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Namibië familie-safari"
            />
            <Button onClick={create} disabled={!editable || atLimit}>
              <Plus className="size-4" /> Reis aanmaken
            </Button>
          </div>
          {!editable && (
            <p className="text-sm text-muted-foreground">
              Je huidige rol is alleen-lezen. Wissel rechtsboven van rol om te bewerken.
            </p>
          )}
          {atLimit && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <Lock className="size-4" /> Limiet van {plan.tripLimit} reizen bereikt op {plan.name}.{" "}
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
              Aftellen naar {nextTrip.name} · {nextTrip.start}
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
            {f === "all" ? `Alles (${state.trips.length})` : `${STATUS_LABEL[f]} (${counts[f]})`}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            downloadJson(state, state.branding.brandName);
            toast.success("Back-up gedownload");
          }}
        >
          <Download className="size-4" /> JSON back-up
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
                      onClick={() => {
                        removeTrip(trip.id);
                        toast.success("Reis verwijderd");
                      }}
                      aria-label="Reis verwijderen"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{STATUS_LABEL[tripStatus(trip)]}</Badge>
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
                    van {formatMoney(trip.budget, base)}
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
