import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, MapPin, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { canEdit, planOf } from "@/lib/plans";
import { TEMPLATES, type TripTemplate } from "@/lib/types";
import { convert, formatMoney } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reizen — AtlasLedger Multi-Trip Planner" },
      {
        name: "description",
        content:
          "Overzicht van al je reizen: budget, uitgaven in elke valuta en bestemmingen wereldwijd.",
      },
      { property: "og:title", content: "Reizen — AtlasLedger Multi-Trip Planner" },
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

  const atLimit = state.trips.length >= plan.tripLimit;
  const base = state.baseCurrency;

  const totals = state.trips.map((t) => ({
    id: t.id,
    spent: t.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
  }));
  const grand = totals.reduce((s, t) => s + t.spent, 0);

  function create() {
    if (!name.trim()) return toast.error("Geef de reis een naam");
    if (atLimit) return toast.error(`Je Free-plan staat ${plan.tripLimit} reizen toe. Upgrade naar Pro.`);
    const id = addTrip(name.trim(), template);
    setName("");
    toast.success("Reis aangemaakt");
    navigate({ to: "/trips/$tripId", params: { tripId: id } });
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.trips.map((trip) => {
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
                <p className="text-xs text-muted-foreground">
                  {trip.start} → {trip.end}
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
