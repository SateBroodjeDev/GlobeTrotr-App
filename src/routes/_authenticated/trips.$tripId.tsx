import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  BookOpen,
  FileDown,
  FileText,
  Globe2,
  Paperclip,
  Pencil,
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
  type Trip,
  type TravelItem,
  type ItineraryItem,
} from "@/lib/types";
import { CURRENCIES, convert, formatMoney } from "@/lib/services";
import type { GeoResult } from "@/lib/services";
import { downloadCsv, openGuide, openPdf } from "@/lib/exporters";
import { uid } from "@/lib/workspace";
import { travelersOf } from "@/lib/settle";
import { PlaceSearch } from "@/components/PlaceSearch";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CurrencyConverter, FuelCalculator } from "@/components/TripTools";
import { Settlement } from "@/components/Settlement";
import { Packing } from "@/components/Packing";
import { Countdown } from "@/components/Countdown";
import { TripBookings } from "@/components/TripBookings";
import { TripMembers } from "@/components/TripMembers";
import { TripTimeline } from "@/components/TripTimeline";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripMap = lazy(() => import("@/components/TripMap"));

type TripSettingsDraft = {
  name: string;
  description: string;
  start: string;
  end: string;
  budget: string;
  template: Trip["template"];
};

function settingsFromTrip(trip: Trip): TripSettingsDraft {
  return {
    name: trip.name,
    description: trip.description ?? "",
    start: trip.start,
    end: trip.end,
    budget: String(trip.budget),
    template: trip.template,
  };
}

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
  const { state, updateTrip, saveTripNow, removeTrip, rates, ratesLive } = useWorkspace();
  const navigate = useNavigate();
  const found = state.trips.find((t) => t.id === tripId);
  if (!found) throw notFound();
  const trip = found;

  const base = state.baseCurrency;
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["profile-owner-name", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.display_name as string | null | undefined;
    },
  });
  const ownerName =
    profileQuery.data?.trim() ||
    String(user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "Jij");
  const financialTravelers = travelersOf(trip, [ownerName]);
  const editable = canEdit(state.role);
  const [editingBooking, setEditingBooking] = useState<TravelItem | null>(null);
  async function updateItineraryItem(item: ItineraryItem) {
    if (!editable) return;
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        itinerary: current.itinerary
          .map((existing) =>
            existing.id === item.id
              ? { ...existing, day: item.day, title: item.title, notes: item.notes ?? "" }
              : existing,
          )
          .sort((a, b) => a.day.localeCompare(b.day)),
      }));
      toast.success("Programma-item gewijzigd.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Programma-item kon niet worden gewijzigd.",
      );
      throw error;
    }
  }
  const canMarkBillable = hasFeature(state.plan, "billable_expenses");
  const canManageReceipts = hasFeature(state.plan, "receipts");
  const spent = trip.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const billable = trip.expenses
    .filter((e) => e.billable)
    .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const estimatedFuel = (trip.travelItems ?? [])
    .filter((travelItem) => travelItem.type === "transport")
    .reduce((sum, travelItem) => {
      const details = travelItem.details;
      const local =
        (Number(details?.distanceKm ?? 0) *
          Number(details?.consumptionPer100Km ?? 0) *
          Number(details?.fuelPricePerLiter ?? 0)) /
        100;
      return (
        sum + convert(local, details?.fuelCurrency ?? travelItem.currency ?? base, base, rates)
      );
    }, 0);

  const [draft, setDraft] = useState<Omit<Expense, "id">>({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    category: "food",
    amount: 0,
    currency: "EUR",
    paidBy: ownerName,
    billable: false,
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string>();
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string>();
  const [sharePin, setSharePin] = useState("");
  const [sharingSaving, setSharingSaving] = useState(false);
  const [settings, setSettings] = useState<TripSettingsDraft>(() => settingsFromTrip(trip));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [activeStopId, setActiveStopId] = useState<string>();
  const visibleStops = showAllStops ? trip.stops : trip.stops.slice(0, 4);
  const selectStop = useCallback((id: string) => setActiveStopId(id), []);

  useEffect(() => {
    setSettings(settingsFromTrip(trip));
  }, [trip.id, trip.name, trip.description, trip.start, trip.end, trip.budget, trip.template]);

  async function saveTripSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = settings.name.trim();
    const budget = Number(settings.budget);
    if (!name) {
      toast.error("Een reisnaam is verplicht.");
      return;
    }
    if (!settings.start || !settings.end) {
      toast.error("Vul een start- en einddatum in.");
      return;
    }
    if (settings.end < settings.start) {
      toast.error("De einddatum kan niet vóór de startdatum liggen.");
      return;
    }
    if (!settings.budget.trim() || !Number.isFinite(budget) || budget < 0) {
      toast.error("Vul een budget van nul of hoger in.");
      return;
    }

    setSettingsSaving(true);
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        name,
        description: settings.description.trim() || undefined,
        start: settings.start,
        end: settings.end,
        budget,
        template: settings.template,
      }));
      setSettings((current) => ({ ...current, name, budget: String(budget) }));
      toast.success("Reisinstellingen opgeslagen.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Reisinstellingen konden niet worden opgeslagen.",
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function saveSharing(
    changes: Partial<{
      isPublic: boolean;
      shareFinancials: boolean;
      sharePinHash: string | undefined;
    }>,
    successMessage: string,
  ) {
    setSharingSaving(true);
    try {
      await saveTripNow(trip.id, (current) => {
        const updated = {
          ...current,
          public: changes.isPublic ?? current.public ?? false,
          shareFinancials: changes.shareFinancials ?? current.shareFinancials ?? false,
        };
        if (!("sharePinHash" in changes)) return updated;
        if (changes.sharePinHash) return { ...updated, sharePinHash: changes.sharePinHash };
        const { sharePinHash: _sharePinHash, ...withoutPin } = updated;
        return withoutPin;
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wijziging kon niet worden opgeslagen.");
    } finally {
      setSharingSaving(false);
    }
  }

  async function addExpense() {
    if (!draft.title.trim() || !Number.isFinite(draft.amount) || draft.amount <= 0) {
      toast.error("Vul een omschrijving en bedrag groter dan nul in.");
      return;
    }
    setExpenseSaving(true);
    try {
      await saveTripNow(trip.id, (t) => ({
        ...t,
        expenses: editingExpenseId
          ? t.expenses.map((expense) =>
              expense.id === editingExpenseId
                ? { ...draft, billable: canMarkBillable && draft.billable, id: editingExpenseId }
                : expense,
            )
          : [...t.expenses, { ...draft, billable: canMarkBillable && draft.billable, id: uid() }],
        travelItems: editingExpenseId
          ? (t.travelItems ?? []).map((travelItem) =>
              travelItem.expenseId === editingExpenseId
                ? {
                    ...travelItem,
                    title: draft.title.trim(),
                    date: draft.date,
                    amount: draft.amount,
                    currency: draft.currency,
                  }
                : travelItem,
            )
          : t.travelItems,
      }));
      setDraft({ ...draft, title: "", amount: 0, notes: undefined, splitWith: undefined });
      setEditingExpenseId(undefined);
      toast.success(editingExpenseId ? "Uitgave bijgewerkt" : "Uitgave geboekt");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Uitgave kon niet worden opgeslagen.");
    } finally {
      setExpenseSaving(false);
    }
  }

  async function saveTravelItem(
    item: TravelItem,
    locations: GeoResult[],
    paidBy: string,
    previousId?: string,
  ) {
    const previous = previousId
      ? (trip.travelItems ?? []).find((current) => current.id === previousId)
      : undefined;
    const expenseId = item.amount ? (previous?.expenseId ?? uid()) : undefined;
    const category: ExpenseCategory =
      item.type === "lodging" ? "lodging" : item.type === "activity" ? "activities" : "transport";
    try {
      await saveTripNow(trip.id, (current) => {
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
          travelItems: previousId
            ? (current.travelItems ?? []).map((travelItem) =>
                travelItem.id === previousId ? { ...item, expenseId } : travelItem,
              )
            : [...(current.travelItems ?? []), { ...item, expenseId }],
          itinerary: current.itinerary,
          expenses:
            item.amount && expenseId
              ? [
                  ...current.expenses.filter((expense) => expense.id !== expenseId),
                  {
                    ...current.expenses.find((expense) => expense.id === expenseId),
                    id: expenseId,
                    date: item.date,
                    title: item.title,
                    category,
                    amount: item.amount,
                    currency: item.currency ?? base,
                    paidBy,
                    billable:
                      current.expenses.find((expense) => expense.id === expenseId)?.billable ??
                      false,
                  },
                ]
              : previous?.expenseId
                ? current.expenses.filter((expense) => expense.id !== previous.expenseId)
                : current.expenses,
        };
      });
      toast.success(
        item.amount
          ? previousId
            ? "Onderdeel en gekoppelde kosten bijgewerkt."
            : "Onderdeel, kaartlocatie en kosten opgeslagen."
          : previousId
            ? "Reisonderdeel bijgewerkt."
            : "Onderdeel en kaartlocatie opgeslagen.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Reisonderdeel kon niet worden opgeslagen.",
      );
      throw error;
    }
  }

  async function removeTravelItem(id: string) {
    const item = (trip.travelItems ?? []).find((current) => current.id === id);
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        travelItems: (current.travelItems ?? []).filter((travelItem) => travelItem.id !== id),
        itinerary: current.itinerary.filter(
          (planningItem) =>
            planningItem.sourceTravelItemId !== id &&
            !(planningItem.day === item?.date && planningItem.title === item?.title),
        ),
        expenses: item?.expenseId
          ? current.expenses.filter((expense) => expense.id !== item.expenseId)
          : current.expenses,
      }));
      toast.success(
        item?.expenseId ? "Onderdeel en gekoppelde kosten verwijderd." : "Onderdeel verwijderd.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Reisonderdeel kon niet worden verwijderd.",
      );
      throw error;
    }
  }

  async function addStop(location: GeoResult) {
    const stopId = uid();
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        stops: [...current.stops, { id: stopId, ...location, nights: 1 }],
      }));
      setActiveStopId(stopId);
      toast.success(`${location.name} toegevoegd.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bestemming kon niet worden opgeslagen.",
      );
    }
  }

  async function removeStop(stopId: string) {
    if (!window.confirm("Deze bestemming van de routekaart verwijderen?")) return;
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        stops: current.stops.filter((stop) => stop.id !== stopId),
      }));
      if (activeStopId === stopId) setActiveStopId(undefined);
      toast.success("Bestemming verwijderd.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bestemming kon niet worden verwijderd.",
      );
    }
  }

  async function toggleArchive() {
    if (!window.confirm(trip.archived ? "Deze reis weer actief maken?" : "Deze reis archiveren?")) {
      return;
    }
    try {
      await saveTripNow(trip.id, (current) => ({ ...current, archived: !current.archived }));
      toast.success(trip.archived ? "Reis heractiveerd." : "Reis gearchiveerd.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Reisstatus kon niet worden opgeslagen.",
      );
    }
  }

  async function removeExpense(expenseId: string) {
    if (
      !window.confirm(
        "Deze uitgave verwijderen? De koppeling met een eventueel reisonderdeel wordt losgemaakt.",
      )
    ) {
      return;
    }
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        expenses: current.expenses.filter((expense) => expense.id !== expenseId),
        travelItems: (current.travelItems ?? []).map((travelItem) =>
          travelItem.expenseId === expenseId
            ? { ...travelItem, expenseId: undefined, amount: undefined }
            : travelItem,
        ),
      }));
      toast.success("Uitgave verwijderd.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Uitgave kon niet worden verwijderd.");
    }
  }

  async function uploadReceipt(expense: Expense, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!canManageReceipts) {
      toast.error("Bonnetjes koppelen is beschikbaar in het Agency-plan.");
      event.target.value = "";
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Kies een PDF, JPG, PNG of WebP tot 10 MB.");
      event.target.value = "";
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "file";
    const storagePath = `${user.id}/${trip.id}/${expense.id}/${crypto.randomUUID()}.${extension}`;
    setUploadingReceiptId(expense.id);
    try {
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      try {
        await saveTripNow(trip.id, (current) => ({
          ...current,
          expenses: current.expenses.map((item) =>
            item.id === expense.id
              ? { ...item, receiptPath: storagePath, receiptName: file.name }
              : item,
          ),
        }));
      } catch (error) {
        await supabase.storage.from("receipts").remove([storagePath]);
        throw error;
      }
      toast.success("Bon gekoppeld aan de uitgave.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bon kon niet worden geüpload.");
    } finally {
      setUploadingReceiptId(undefined);
      event.target.value = "";
    }
  }

  async function openReceipt(expense: Expense) {
    if (!expense.receiptPath) return;
    if (!canManageReceipts) {
      toast.error("Bonnetjes bekijken is beschikbaar in het Agency-plan.");
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(expense.receiptPath, 60 * 5);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Bon kon niet worden geopend.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bon kon niet worden geopend.");
    }
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

      <div
        className={`grid gap-4 ${canMarkBillable || estimatedFuel > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <Stat label="Uitgegeven" value={formatMoney(spent, base)} />
        <Stat label="Budget" value={formatMoney(trip.budget, base)} />
        {estimatedFuel > 0 && (
          <Stat label="Brandstofprognose" value={formatMoney(estimatedFuel, base)} />
        )}
        {canMarkBillable && <Stat label="Declarabel" value={formatMoney(billable, base)} />}
      </div>
      <Progress value={trip.budget ? Math.min(100, (spent / trip.budget) * 100) : 0} />

      <Tabs defaultValue="route">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="route">Routekaart</TabsTrigger>
          <TabsTrigger value="plan">Reisschema</TabsTrigger>
          {editable && <TabsTrigger value="plan-edit">Reisschema aanpassen</TabsTrigger>}
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
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveTripSettings}>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Reisnaam</span>
                  <Input
                    value={settings.name}
                    disabled={!editable || settingsSaving}
                    required
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Reisomschrijving</span>
                  <Textarea
                    value={settings.description}
                    disabled={!editable || settingsSaving}
                    maxLength={500}
                    rows={4}
                    placeholder="Vertel kort wat deze reis bijzonder maakt. Deze tekst verschijnt ook op de publieke reispagina."
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                  <span className="block text-right text-xs text-muted-foreground">
                    {settings.description.length}/500
                  </span>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Startdatum</span>
                  <Input
                    type="date"
                    value={settings.start}
                    disabled={!editable || settingsSaving}
                    required
                    onChange={(event) => {
                      const start = event.target.value;
                      setSettings((current) => ({
                        ...current,
                        start,
                        end: current.end && current.end < start ? start : current.end,
                      }));
                    }}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Einddatum</span>
                  <Input
                    type="date"
                    value={settings.end}
                    min={settings.start || undefined}
                    disabled={!editable || settingsSaving}
                    required
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, end: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Budget ({base})</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.budget}
                    disabled={!editable || settingsSaving}
                    required
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, budget: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Reistemplate</span>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.template}
                    disabled={!editable || settingsSaving}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        template: event.target.value as Trip["template"],
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
                <div className="mt-2 flex items-end sm:col-span-2">
                  <Button type="submit" disabled={!editable || settingsSaving}>
                    {settingsSaving ? "Opslaan…" : "Wijzigingen opslaan"}
                  </Button>
                </div>
              </form>
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
                disabled={!editable || sharingSaving}
                onChange={(checked) =>
                  void saveSharing(
                    { isPublic: checked },
                    checked ? "Reis is openbaar gemaakt." : "Reis is privé gemaakt.",
                  )
                }
              />
              {trip.public && (
                <>
                  <ToggleSetting
                    label="Budget delen"
                    description="Toon het budget op de openbare reispagina."
                    checked={trip.shareFinancials ?? false}
                    disabled={!editable || sharingSaving}
                    onChange={(checked) =>
                      void saveSharing(
                        { shareFinancials: checked },
                        checked
                          ? "Budget wordt openbaar gedeeld."
                          : "Budget wordt niet meer gedeeld.",
                      )
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
                        disabled={!editable || sharingSaving}
                        onChange={(e) => setSharePin(e.target.value.replace(/\D/g, ""))}
                        placeholder={trip.sharePinHash ? "Nieuwe PIN" : "Kies een PIN"}
                      />
                      <Button
                        variant="outline"
                        disabled={!editable || sharingSaving || sharePin.length < 6}
                        onClick={async () => {
                          const sharePinHash = await hashSharingPin(sharePin);
                          await saveSharing(
                            { sharePinHash },
                            trip.sharePinHash
                              ? "PIN-beveiliging is gewijzigd."
                              : "PIN-beveiliging is ingeschakeld.",
                          );
                          setSharePin("");
                        }}
                      >
                        {trip.sharePinHash ? "PIN wijzigen" : "PIN instellen"}
                      </Button>
                      {trip.sharePinHash && (
                        <Button
                          variant="ghost"
                          disabled={!editable || sharingSaving}
                          onClick={() =>
                            void saveSharing(
                              { sharePinHash: undefined },
                              "PIN-beveiliging is verwijderd.",
                            )
                          }
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
            ownerName={ownerName}
            ownerEmail={user?.email ?? "Eigenaar van deze reis"}
            onChange={(members) =>
              updateTrip(trip.id, (current) => ({
                ...current,
                members,
                travelers: [ownerName, ...members.map((member) => member.name)],
              }))
            }
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
                <Button variant="outline" disabled={!editable} onClick={() => void toggleArchive()}>
                  <Archive className="size-4" /> {trip.archived ? "Heractiveren" : "Archiveren"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!editable}
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Weet je zeker dat je ${trip.name} definitief wilt verwijderen?`,
                      )
                    ) {
                      try {
                        await removeTrip(trip.id);
                        toast.success("Reis verwijderd");
                        navigate({ to: "/dashboard" });
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Reis kon niet worden verwijderd.",
                        );
                      }
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]">
            <Card className="surface overflow-hidden">
              <CardContent className="p-3">
                <ClientOnly
                  fallback={<Skeleton className="h-[500px] w-full rounded-xl sm:h-[560px]" />}
                >
                  <Suspense
                    fallback={<Skeleton className="h-[500px] w-full rounded-xl sm:h-[560px]" />}
                  >
                    <TripMap
                      stops={trip.stops}
                      activeStopId={activeStopId}
                      onStopSelect={selectStop}
                    />
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
                  <PlaceSearch disabled={!editable} onPick={(location) => void addStop(location)} />
                  {trip.stops.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {trip.stops.length} {trip.stops.length === 1 ? "bestemming" : "bestemmingen"}
                      {activeStopId ? " · geselecteerde bestemming is op de kaart uitgelicht" : ""}
                    </p>
                  )}
                  <ol className="space-y-2">
                    {visibleStops.map((s) => {
                      const stopIndex = trip.stops.findIndex((stop) => stop.id === s.id);
                      return (
                        <li
                          key={s.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                            activeStopId === s.id
                              ? "border-primary bg-primary/10"
                              : "border-transparent bg-muted/60 hover:bg-muted"
                          }`}
                          onClick={() => setActiveStopId(s.id)}
                        >
                          <button type="button" className="min-w-0 flex-1 text-left">
                            <span className="mr-2 text-muted-foreground">{stopIndex + 1}.</span>
                            {s.name}
                            <span className="ml-2 text-xs text-muted-foreground">{s.country}</span>
                          </button>
                          {editable && (
                            <button
                              type="button"
                              aria-label="Verwijder bestemming"
                              onClick={(event) => {
                                event.stopPropagation();
                                void removeStop(s.id);
                              }}
                            >
                              <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {trip.stops.length > 4 && (
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllStops((current) => !current)}
                    >
                      {showAllStops
                        ? "Minder bestemmingen tonen"
                        : `Alle ${trip.stops.length} bestemmingen tonen`}
                    </Button>
                  )}
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
          <TripTimeline
            trip={trip}
            baseCurrency={base}
            editable={false}
            {...(editable
              ? { onUpdate: updateItineraryItem, onEditBooking: setEditingBooking }
              : {})}
            onAdd={async () => undefined}
            onRemove={async () => undefined}
          />
        </TabsContent>

        {editable && editingBooking && (
          <TripBookings
            key={editingBooking.id}
            trip={trip}
            editable={editable}
            payers={financialTravelers}
            onSave={saveTravelItem}
            onRemove={removeTravelItem}
            initialItem={editingBooking}
            onFinish={() => setEditingBooking(null)}
          />
        )}

        {editable && (
          <TabsContent value="plan-edit" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Voeg boekingen en eigen programma-items toe of wijzig ze. Het overzicht zelf staat in
              Reisschema.
            </p>
            <TripBookings
              trip={trip}
              editable={editable}
              payers={financialTravelers}
              onSave={saveTravelItem}
              onRemove={removeTravelItem}
            />
            <TripTimeline
              trip={trip}
              baseCurrency={base}
              editable={editable}
              onUpdate={updateItineraryItem}
              onEditBooking={setEditingBooking}
              onAdd={async (next) => {
                try {
                  await saveTripNow(trip.id, (current) => ({
                    ...current,
                    itinerary: [...current.itinerary, { id: uid(), ...next }].sort((a, b) =>
                      a.day.localeCompare(b.day),
                    ),
                  }));
                  toast.success("Programma-item opgeslagen.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Programma-item kon niet worden opgeslagen.",
                  );
                  throw error;
                }
              }}
              onRemove={async (id) => {
                try {
                  await saveTripNow(trip.id, (current) => ({
                    ...current,
                    itinerary: current.itinerary.filter((planningItem) => planningItem.id !== id),
                  }));
                  toast.success("Programma-item verwijderd.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Programma-item kon niet worden verwijderd.",
                  );
                  throw error;
                }
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="expenses" className="space-y-4">
          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {editingExpenseId ? "Uitgave wijzigen" : "Uitgave boeken (elke valuta)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid items-end gap-3 md:grid-cols-7">
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
                <select
                  aria-label="Betaald door"
                  className="rounded-lg border border-input bg-card px-3 text-sm"
                  value={draft.paidBy}
                  disabled={!editable}
                  onChange={(e) => setDraft({ ...draft, paidBy: e.target.value })}
                >
                  {financialTravelers.map((payer) => (
                    <option key={payer} value={payer}>
                      Betaald door: {payer}
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
              </div>
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Verdelen tussen</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {financialTravelers.map((traveler) => {
                    const selected = !draft.splitWith?.length || draft.splitWith.includes(traveler);
                    return (
                      <label key={traveler} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!editable}
                          onChange={(event) => {
                            const current = draft.splitWith?.length
                              ? draft.splitWith
                              : [...financialTravelers];
                            const splitWith = event.target.checked
                              ? Array.from(new Set([...current, traveler]))
                              : current.filter((person) => person !== traveler);
                            setDraft({ ...draft, splitWith });
                          }}
                        />
                        {traveler}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Input
                value={draft.notes ?? ""}
                disabled={!editable}
                placeholder="Notitie (optioneel)"
                onChange={(event) => setDraft({ ...draft, notes: event.target.value || undefined })}
              />
              <div className="flex flex-wrap justify-end gap-2">
                {editingExpenseId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingExpenseId(undefined);
                      setDraft({
                        date: new Date().toISOString().slice(0, 10),
                        title: "",
                        category: "food",
                        amount: 0,
                        currency: base,
                        paidBy: ownerName,
                        billable: false,
                      });
                    }}
                  >
                    Annuleren
                  </Button>
                )}
                <Button onClick={() => void addExpense()} disabled={!editable || expenseSaving}>
                  <Plus className="size-4" />{" "}
                  {expenseSaving ? "Opslaan…" : editingExpenseId ? "Opslaan" : "Boeken"} (
                  {formatMoney(convert(draft.amount || 0, draft.currency, base, rates), base)})
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface min-w-0 overflow-hidden">
            <CardContent
              className="overflow-x-auto p-0"
              tabIndex={0}
              role="region"
              aria-label="Uitgavenoverzicht"
            >
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Datum</th>
                    <th className="p-3">Omschrijving</th>
                    <th className="p-3">Categorie</th>
                    <th className="p-3">Betaald door</th>
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
                        {canManageReceipts && e.receiptPath && (
                          <button
                            type="button"
                            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                            onClick={() => void openReceipt(e)}
                          >
                            <Paperclip className="size-3" /> {e.receiptName || "Bon bekijken"}
                          </button>
                        )}
                      </td>
                      <td className="p-3">{CATEGORIES.find((c) => c.id === e.category)?.label}</td>
                      <td className="p-3">{e.paidBy}</td>
                      <td className="p-3 text-right">
                        {e.amount.toFixed(2)} {e.currency}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatMoney(convert(e.amount, e.currency, base, rates), base)}
                      </td>
                      <td className="p-3 text-right">
                        {editable && (
                          <span className="inline-flex">
                            {canManageReceipts && (
                              <label
                                className={`grid size-7 cursor-pointer place-items-center rounded text-muted-foreground hover:text-foreground ${
                                  uploadingReceiptId === e.id
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }`}
                                title="Bon koppelen"
                              >
                                <Paperclip className="size-4" />
                                <input
                                  className="sr-only"
                                  type="file"
                                  accept="application/pdf,image/jpeg,image/png,image/webp"
                                  disabled={uploadingReceiptId === e.id}
                                  onChange={(event) => void uploadReceipt(e, event)}
                                />
                              </label>
                            )}
                            <button
                              aria-label="Wijzig uitgave"
                              className="p-1 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingExpenseId(e.id);
                                setDraft({ ...e });
                              }}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              aria-label="Verwijder uitgave"
                              className="p-1 text-muted-foreground hover:text-destructive"
                              onClick={() => void removeExpense(e.id)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </span>
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
            editable={editable}
            fallback={[ownerName]}
            manageTravelersInSettings
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
