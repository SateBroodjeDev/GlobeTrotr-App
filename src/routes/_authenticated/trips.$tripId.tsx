import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  BookOpen,
  FileDown,
  FileText,
  Globe2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { canEdit, canExport, hasFeature } from "@/lib/plans";
import {
  CATEGORIES,
  STATUS_LABEL,
  TEMPLATES,
  tripStatus,
  type Expense,
  type ExpenseCategory,
  type TravelItem,
} from "@/lib/types";
import { CURRENCIES, convert, formatMoney } from "@/lib/services";
import type { GeoResult } from "@/lib/services";
import { downloadCsv, openGuide, openPdf } from "@/lib/exporters";
import { uid } from "@/lib/workspace";
import { PlaceSearch } from "@/components/PlaceSearch";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CurrencyConverter, FuelCalculator } from "@/components/TripTools";
import { Settlement } from "@/components/Settlement";
import { Packing } from "@/components/Packing";
import { Countdown } from "@/components/Countdown";
import { TripBookings } from "@/components/TripBookings";
import { TripMembers } from "@/components/TripMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripMap = lazy(() => import("@/components/TripMap"));

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Reisdetail — GlobeTrotr" },
      {
        name: "description",
        content: "Routekaart, dagplanning en multi-valuta uitgaven van deze reis.",
      },
      { property: "og:title", content: "Reisdetail — GlobeTrotr" },
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
      <Link to="/dashboard" className="underline">
        Terug naar overzicht
      </Link>
    </p>
  ),
});

function TripDetail() {
  const { tripId } = Route.useParams();
  const { state, updateTrip, removeTrip, rates, ratesLive } = useWorkspace();
  const navigate = useNavigate();
  const found = state.trips.find((t) => t.id === tripId);
  if (!found) throw notFound();
  const trip = found;

  const base = state.baseCurrency;
  const editable = canEdit(state.role);
  const canMarkBillable = hasFeature(state.plan, "billable_expenses");
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
  const [sharePin, setSharePin] = useState("");

  function addExpense() {
    if (!draft.title.trim() || !draft.amount) {
      toast.error("Vul omschrijving en bedrag in");
      return;
    }
    updateTrip(trip.id, (t) => ({
      ...t,
      expenses: [
        ...t.expenses,
        { ...draft, billable: canMarkBillable && draft.billable, id: uid() },
      ],
    }));
    setDraft({ ...draft, title: "", amount: 0 });
    toast.success("Uitgave geboekt");
  }

  function changeStartDate(start: string) {
    updateTrip(trip.id, (current) => ({
      ...current,
      start,
      // Keep the date range valid when the start date moves past the old end date.
      end: current.end && current.end < start ? start : current.end,
    }));
  }

  function changeEndDate(end: string) {
    if (end && trip.start && end < trip.start) {
      toast.error("De einddatum kan niet vóór de startdatum liggen.");
      return;
    }
    updateTrip(trip.id, (current) => ({ ...current, end }));
  }

  function addTravelItem(item: TravelItem, locations: GeoResult[]) {
    const expenseId = item.amount ? uid() : undefined;
    const category: ExpenseCategory =
      item.type === "lodging" ? "lodging" : item.type === "activity" ? "activities" : "transport";
    updateTrip(trip.id, (current) => {
      const stops = [...current.stops];
      for (const location of locations) {
        const exists = stops.some(
          (stop) =>
            Math.abs(stop.lat - location.lat) < 0.01 && Math.abs(stop.lon - location.lon) < 0.01,
        );
        if (!exists) stops.push({ id: uid(), ...location, nights: 0 });
      }
      return {
        ...current,
        stops,
        travelItems: [...(current.travelItems ?? []), { ...item, expenseId }],
        itinerary: [...current.itinerary, { id: uid(), day: item.date, title: item.title }].sort(
          (a, b) => a.day.localeCompare(b.day),
        ),
        expenses:
          item.amount && expenseId
            ? [
                ...current.expenses,
                {
                  id: expenseId,
                  date: item.date,
                  title: item.title,
                  category,
                  amount: item.amount,
                  currency: item.currency ?? base,
                  paidBy: state.members[0]?.name ?? "Ik",
                  billable: false,
                },
              ]
            : current.expenses,
      };
    });
    toast.success(
      item.amount
        ? "Onderdeel, kaartlocatie en kosten opgeslagen."
        : "Onderdeel en kaartlocatie opgeslagen.",
    );
  }

  function removeTravelItem(id: string) {
    const item = (trip.travelItems ?? []).find((current) => current.id === id);
    updateTrip(trip.id, (current) => ({
      ...current,
      travelItems: (current.travelItems ?? []).filter((travelItem) => travelItem.id !== id),
      expenses: item?.expenseId
        ? current.expenses.filter((expense) => expense.id !== item.expenseId)
        : current.expenses,
    }));
    toast.success(
      item?.expenseId ? "Onderdeel en gekoppelde kosten verwijderd." : "Onderdeel verwijderd.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
            ← Alle reizen
          </Link>
          <h1 className="font-display text-2xl font-semibold">{trip.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{STATUS_LABEL[tripStatus(trip)]}</Badge>
            {trip.start} → {trip.end} · {trip.stops.length} bestemmingen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            variant="outline"
            disabled={!canExport(state.role)}
            onClick={() => {
              if (!openGuide(trip, base, rates, state.branding))
                toast.error("Sta pop-ups toe om de reisgids te openen.");
            }}
          >
            <BookOpen className="size-4" /> Reisgids
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

      {tripStatus(trip) === "upcoming" && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aftellen tot vertrek</CardTitle>
          </CardHeader>
          <CardContent>
            <Countdown date={trip.start} />
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${canMarkBillable ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <Stat label="Uitgegeven" value={formatMoney(spent, base)} />
        <Stat label="Budget" value={formatMoney(trip.budget, base)} />
        {canMarkBillable && <Stat label="Declarabel" value={formatMoney(billable, base)} />}
      </div>
      <Progress value={trip.budget ? Math.min(100, (spent / trip.budget) * 100) : 0} />

      <Tabs defaultValue="route">
        <TabsList>
          <TabsTrigger value="route">Routekaart</TabsTrigger>
          <TabsTrigger value="plan">Reisschema</TabsTrigger>
          <TabsTrigger value="expenses">Uitgaven</TabsTrigger>
          <TabsTrigger value="money">Geld-tools</TabsTrigger>
          <TabsTrigger value="packing">Paklijst</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="size-4" /> Reisinstellingen
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Reisnaam</span>
                <Input
                  value={trip.name}
                  disabled={!editable}
                  onChange={(e) => updateTrip(trip.id, (t) => ({ ...t, name: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Startdatum</span>
                <Input
                  type="date"
                  value={trip.start}
                  disabled={!editable}
                  onChange={(e) => changeStartDate(e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Einddatum</span>
                <Input
                  type="date"
                  value={trip.end}
                  min={trip.start || undefined}
                  disabled={!editable}
                  onChange={(e) => changeEndDate(e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Budget ({base})</span>
                <Input
                  type="number"
                  min="0"
                  value={trip.budget}
                  disabled={!editable}
                  onChange={(e) =>
                    updateTrip(trip.id, (t) => ({
                      ...t,
                      budget: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Reistemplate</span>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={trip.template}
                  disabled={!editable}
                  onChange={(e) =>
                    updateTrip(trip.id, (t) => ({
                      ...t,
                      template: e.target.value as typeof t.template,
                    }))
                  }
                >
                  {TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.emoji} {template.label}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe2 className="size-4" /> Openbaar delen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ToggleSetting
                label="Reis openbaar maken"
                description="Toon deze reis op de homepage via een unieke link."
                checked={trip.public ?? false}
                disabled={!editable}
                onChange={(checked) => updateTrip(trip.id, (t) => ({ ...t, public: checked }))}
              />
              {trip.public && (
                <>
                  <ToggleSetting
                    label="Budget delen"
                    description="Toon het budget op de openbare reispagina."
                    checked={trip.shareFinancials ?? false}
                    disabled={!editable}
                    onChange={(checked) =>
                      updateTrip(trip.id, (t) => ({ ...t, shareFinancials: checked }))
                    }
                  />
                  <div className="space-y-2">
                    <p className="font-medium">PIN-beveiliging</p>
                    <p className="text-muted-foreground">
                      Beveilig deze openbare reis met een PIN van 6 tot 12 cijfers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="max-w-48"
                        type="password"
                        inputMode="numeric"
                        minLength={6}
                        maxLength={12}
                        value={sharePin}
                        disabled={!editable}
                        onChange={(e) => setSharePin(e.target.value.replace(/\D/g, ""))}
                        placeholder={trip.sharePinHash ? "Nieuwe PIN" : "Kies een PIN"}
                      />
                      <Button
                        variant="outline"
                        disabled={!editable || sharePin.length < 6}
                        onClick={async () => {
                          const sharePinHash = await hashSharingPin(sharePin);
                          updateTrip(trip.id, (t) => ({ ...t, sharePinHash }));
                          setSharePin("");
                          toast.success("PIN-beveiliging ingeschakeld.");
                        }}
                      >
                        {trip.sharePinHash ? "PIN wijzigen" : "PIN instellen"}
                      </Button>
                      {trip.sharePinHash && (
                        <Button
                          variant="ghost"
                          disabled={!editable}
                          onClick={() => {
                            updateTrip(trip.id, ({ sharePinHash: _hash, ...t }) => t);
                            toast.success("PIN-beveiliging verwijderd.");
                          }}
                        >
                          PIN verwijderen
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <TripMembers
            members={trip.members ?? []}
            plan={state.plan}
            editable={editable}
            onChange={(members) => updateTrip(trip.id, (current) => ({ ...current, members }))}
          />

          <Card className="border-destructive/40 surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gevarenzone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                Archiveer de reis of verwijder hem definitief.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!editable}
                  onClick={() => {
                    if (
                      window.confirm(
                        trip.archived ? "Deze reis weer actief maken?" : "Deze reis archiveren?",
                      )
                    ) {
                      updateTrip(trip.id, (t) => ({ ...t, archived: !t.archived }));
                      toast.success(trip.archived ? "Reis heractiveerd" : "Reis gearchiveerd");
                    }
                  }}
                >
                  <Archive className="size-4" /> {trip.archived ? "Heractiveren" : "Archiveren"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!editable}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Weet je zeker dat je ${trip.name} definitief wilt verwijderen?`,
                      )
                    ) {
                      removeTrip(trip.id);
                      toast.success("Reis verwijderd");
                      navigate({ to: "/dashboard" });
                    }
                  }}
                >
                  <Trash2 className="size-4" /> Verwijderen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packing">
          <Packing
            items={trip.packing ?? []}
            editable={editable}
            onChange={(next) => updateTrip(trip.id, (t) => ({ ...t, packing: next }))}
          />
        </TabsContent>

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
                {...(trip.stops.length ? { stop: trip.stops[trip.stops.length - 1]! } : {})}
                enabled={hasFeature(state.plan, "weather")}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <TripBookings
            trip={trip}
            editable={editable}
            onAdd={addTravelItem}
            onRemove={removeTravelItem}
          />
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
              {canMarkBillable && (
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={draft.billable}
                    disabled={!editable}
                    onChange={(e) => setDraft({ ...draft, billable: e.target.checked })}
                  />
                  Declarabel bij klant
                </label>
              )}
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
                        {canMarkBillable && e.billable && (
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

        <TabsContent value="money" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CurrencyConverter rates={rates} base={base} live={ratesLive} />
            <FuelCalculator rates={rates} base={base} />
          </div>
          <Settlement
            trip={trip}
            base={base}
            rates={rates}
            fallback={state.members.map((m) => m.name)}
            editable={editable}
            onTravelers={(people) => updateTrip(trip.id, (t) => ({ ...t, travelers: people }))}
          />
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

function ToggleSetting({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

async function hashSharingPin(pin: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
