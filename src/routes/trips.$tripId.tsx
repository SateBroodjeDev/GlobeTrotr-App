import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { toast } from "sonner";
import { FileDown, FileText, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { canEdit, canExport, hasFeature } from "@/lib/plans";
import { CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";
import { CURRENCIES, convert, formatMoney } from "@/lib/services";
import { downloadCsv, openPdf } from "@/lib/exporters";
import { uid } from "@/lib/workspace";
import { PlaceSearch } from "@/components/PlaceSearch";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CurrencyConverter, FuelCalculator } from "@/components/TripTools";
import { Settlement } from "@/components/Settlement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripMap = lazy(() => import("@/components/TripMap"));

export const Route = createFileRoute("/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Reisdetail — AtlasLedger" },
      {
        name: "description",
        content: "Routekaart, dagplanning en multi-valuta uitgaven van deze reis.",
      },
      { property: "og:title", content: "Reisdetail — AtlasLedger" },
      {
        property: "og:description",
        content: "Routekaart, dagplanning en multi-valuta uitgaven van deze reis.",
      },
    ],
  }),
  component: TripDetail,
  notFoundComponent: () => (
    <p className="text-sm text-muted-foreground">
      Reis niet gevonden.{" "}
      <Link to="/" className="underline">
        Terug naar overzicht
      </Link>
    </p>
  ),
});

function TripDetail() {
  const { tripId } = Route.useParams();
  const { state, updateTrip, rates } = useWorkspace();
  const found = state.trips.find((t) => t.id === tripId);
  if (!found) throw notFound();
  const trip = found;

  const base = state.baseCurrency;
  const editable = canEdit(state.role);
  const spent = trip.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const billable = trip.expenses
    .filter((e) => e.billable)
    .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);

  const [draft, setDraft] = useState<Omit<Expense, "id">>({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    category: "food",
    amount: 0,
    currency: "EUR",
    paidBy: state.members[0]?.name ?? "Ik",
    billable: false,
  });
  const [item, setItem] = useState({ day: trip.start, title: "" });

  function addExpense() {
    if (!draft.title.trim() || !draft.amount) {
      toast.error("Vul omschrijving en bedrag in");
      return;
    }
    updateTrip(trip.id, (t) => ({ ...t, expenses: [...t.expenses, { ...draft, id: uid() }] }));
    setDraft({ ...draft, title: "", amount: 0 });
    toast.success("Uitgave geboekt");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            ← Alle reizen
          </Link>
          <h1 className="font-display text-2xl font-semibold">{trip.name}</h1>
          <p className="text-sm text-muted-foreground">
            {trip.start} → {trip.end} · {trip.stops.length} bestemmingen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!canExport(state.role)}
            onClick={() => {
              downloadCsv(trip, base, rates);
              toast.success("CSV geëxporteerd");
            }}
          >
            <FileDown className="size-4" /> CSV
          </Button>
          <Button
            disabled={!canExport(state.role)}
            onClick={() => {
              if (!hasFeature(state.plan, "pdf_export")) {
                toast.error("PDF-declaraties zitten in Pro en hoger.");
                return;
              }
              if (!openPdf(trip, base, rates, state.branding))
                toast.error("Sta pop-ups toe om de PDF te genereren.");
            }}
          >
            <FileText className="size-4" /> PDF declaratie
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Uitgegeven" value={formatMoney(spent, base)} />
        <Stat label="Budget" value={formatMoney(trip.budget, base)} />
        <Stat label="Declarabel" value={formatMoney(billable, base)} />
      </div>
      <Progress value={trip.budget ? Math.min(100, (spent / trip.budget) * 100) : 0} />

      <Tabs defaultValue="route">
        <TabsList>
          <TabsTrigger value="route">Routekaart</TabsTrigger>
          <TabsTrigger value="plan">Reisschema</TabsTrigger>
          <TabsTrigger value="expenses">Uitgaven</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="surface overflow-hidden">
              <CardContent className="p-3">
                <ClientOnly fallback={<Skeleton className="h-[420px] w-full rounded-xl" />}>
                  <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-xl" />}>
                    <TripMap stops={trip.stops} />
                  </Suspense>
                </ClientOnly>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bestemming toevoegen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PlaceSearch
                    disabled={!editable}
                    onPick={(r) => {
                      updateTrip(trip.id, (t) => ({
                        ...t,
                        stops: [...t.stops, { id: uid(), ...r, nights: 1 }],
                      }));
                      toast.success(`${r.name} toegevoegd`);
                    }}
                  />
                  <ol className="space-y-2">
                    {trip.stops.map((s, i) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                          {s.name}
                          <span className="ml-2 text-xs text-muted-foreground">{s.country}</span>
                        </span>
                        {editable && (
                          <button
                            aria-label="Verwijder bestemming"
                            onClick={() =>
                              updateTrip(trip.id, (t) => ({
                                ...t,
                                stops: t.stops.filter((x) => x.id !== s.id),
                              }))
                            }
                          >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
              <WeatherWidget
                {...(trip.stops.length
                  ? { stop: trip.stops[trip.stops.length - 1]! }
                  : {})}
                enabled={hasFeature(state.plan, "weather")}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dagplanning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="date"
                  value={item.day}
                  disabled={!editable}
                  onChange={(e) => setItem({ ...item, day: e.target.value })}
                  className="sm:w-44"
                />
                <Input
                  value={item.title}
                  disabled={!editable}
                  placeholder="Programma-onderdeel"
                  onChange={(e) => setItem({ ...item, title: e.target.value })}
                />
                <Button
                  disabled={!editable}
                  onClick={() => {
                    if (!item.title.trim()) return;
                    updateTrip(trip.id, (t) => ({
                      ...t,
                      itinerary: [...t.itinerary, { id: uid(), ...item }].sort((a, b) =>
                        a.day.localeCompare(b.day),
                      ),
                    }));
                    setItem({ ...item, title: "" });
                  }}
                >
                  <Plus className="size-4" /> Toevoegen
                </Button>
              </div>
              <ul className="divide-y rounded-xl border border-border">
                {trip.itinerary.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      <Badge variant="secondary" className="mr-2">
                        {i.day}
                      </Badge>
                      {i.title}
                      {i.notes && (
                        <span className="ml-2 text-xs text-muted-foreground">{i.notes}</span>
                      )}
                    </span>
                    {editable && (
                      <button
                        aria-label="Verwijder onderdeel"
                        onClick={() =>
                          updateTrip(trip.id, (t) => ({
                            ...t,
                            itinerary: t.itinerary.filter((x) => x.id !== i.id),
                          }))
                        }
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Uitgave boeken (elke valuta)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-6">
              <Input
                type="date"
                value={draft.date}
                disabled={!editable}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                value={draft.title}
                disabled={!editable}
                placeholder="Omschrijving"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <select
                aria-label="Categorie"
                className="rounded-lg border border-input bg-card px-3 text-sm"
                value={draft.category}
                disabled={!editable}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as ExpenseCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                value={draft.amount || ""}
                disabled={!editable}
                placeholder="Bedrag"
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              />
              <select
                aria-label="Valuta"
                className="rounded-lg border border-input bg-card px-3 text-sm"
                value={draft.currency}
                disabled={!editable}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.billable}
                  disabled={!editable}
                  onChange={(e) => setDraft({ ...draft, billable: e.target.checked })}
                />
                Declarabel bij klant
              </label>
              <div className="md:col-span-4 md:text-right">
                <Button onClick={addExpense} disabled={!editable}>
                  <Plus className="size-4" /> Boeken (
                  {formatMoney(convert(draft.amount || 0, draft.currency, base, rates), base)})
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Datum</th>
                    <th className="p-3">Omschrijving</th>
                    <th className="p-3">Categorie</th>
                    <th className="p-3 text-right">Origineel</th>
                    <th className="p-3 text-right">{base}</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {trip.expenses.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-3 whitespace-nowrap">{e.date}</td>
                      <td className="p-3">
                        {e.title}
                        {e.billable && (
                          <Badge variant="secondary" className="ml-2">
                            declarabel
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">{CATEGORIES.find((c) => c.id === e.category)?.label}</td>
                      <td className="p-3 text-right">
                        {e.amount.toFixed(2)} {e.currency}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatMoney(convert(e.amount, e.currency, base, rates), base)}
                      </td>
                      <td className="p-3 text-right">
                        {editable && (
                          <button
                            aria-label="Verwijder uitgave"
                            onClick={() =>
                              updateTrip(trip.id, (t) => ({
                                ...t,
                                expenses: t.expenses.filter((x) => x.id !== e.id),
                              }))
                            }
                          >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="surface">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
