import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  ArrowDownUp,
  BookOpen,
  CalendarDays,
  Copy,
  FileDown,
  Download,
  FileText,
  Globe2,
  Paperclip,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { canManageTripMoney, canPlanTrip, hasFeature, ownsTrip } from "@/lib/plans";
import { resolveTripCapability } from "@/lib/agency-permissions";
import {
  CATEGORIES,
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
import { downloadCsv, downloadJson, downloadTripCalendar, downloadTripGpx, openGuide, openPdf } from "@/lib/exporters";
import { uid } from "@/lib/workspace";
import {
  normalizeExpenseParticipants,
  ownerParticipantId,
  participantName,
  participantsOf,
  resolveParticipantId,
} from "@/lib/settle";
import { PlaceSearch } from "@/components/PlaceSearch";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CurrencyConverter, FuelCalculator } from "@/components/TripTools";
import { Settlement } from "@/components/Settlement";
import { Packing } from "@/components/Packing";
import { Countdown } from "@/components/Countdown";
import { TripBookings } from "@/components/TripBookings";
import { TripMembers } from "@/components/TripMembers";
import { TripTimeline } from "@/components/TripTimeline";
import { TripBrandingSettings } from "@/components/TripBrandingSettings";
import { TripNotificationPreferences } from "@/components/TripNotificationPreferences";
import { TripDocuments } from "@/components/TripDocuments";
import { TripTemplateApply } from "@/components/TripTemplateApply";
import { TripInsights } from "@/components/TripInsights";
import { TripTasks } from "@/components/TripTasks";
import { TripToday } from "@/components/TripToday";
import { TripCover } from "@/components/TripCover";
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
import { useLocale } from "@/lib/locale";
import { localizeCountry } from "@/lib/localized-values";
import { TRIP_DESCRIPTION_MAX_LENGTH, TRIP_NAME_MAX_LENGTH } from "@/lib/trip-limits";
import { buildTripDuplicate, duplicateTripName } from "@/lib/duplicate-trip";
import { resolveBranding } from "@/lib/branding";
import { getMyAgencyAccess } from "@/lib/agency.functions";
import {
  fuelEstimateFor,
  fuelTravelItemIdForExpense,
  linkFuelExpense,
  remainingFuelEstimate,
} from "@/lib/fuel-costs";

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
  const { locale, text } = useLocale();
  const { tripId } = Route.useParams();
  const { state, addTrip, saveTripNow, removeTrip, rates, ratesLive } = useWorkspace();
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
  const currentAccountName =
    profileQuery.data?.trim() ||
    String(user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "Jij");
  const accessRole = trip.accessRole ?? "owner";
  const agencyAccessQuery = useQuery({
    queryKey: ["trip-agency-access", user?.id, trip.id],
    enabled: Boolean(user && state.plan === "agency" && accessRole !== "owner"),
    queryFn: () => getMyAgencyAccess(),
    retry: false,
  });
  const agencyPermissions = agencyAccessQuery.data?.permissions;
  const agencyAccessPending = agencyAccessQuery.isLoading && accessRole !== "owner";
  const mayManageMembers = accessRole === "owner" || resolveTripCapability(agencyAccessPending, agencyPermissions, "members_manage", false);
  const ownerName = accessRole === "owner" ? currentAccountName : text("Eigenaar", "Owner");
  const ownerParticipant = {
    id: ownerParticipantId(trip.ownerId ?? (accessRole === "owner" ? user?.id : undefined)),
    name: ownerName,
  };
  const financialParticipants = participantsOf(trip, ownerParticipant);
  const editable = resolveTripCapability(agencyAccessPending, agencyPermissions, "trips_plan", canPlanTrip(accessRole));
  const moneyEditable = resolveTripCapability(agencyAccessPending, agencyPermissions, "expenses_manage", canManageTripMoney(accessRole));
  const tripOwner = ownsTrip(accessRole);
  const settingsEditable = tripOwner || resolveTripCapability(agencyAccessPending, agencyPermissions, "trip_settings_manage", false);
  const [exportBrandingOverride,setExportBrandingOverride]=useState(trip.branding);
  const exportBranding = resolveBranding(state.plan, null, state.branding, exportBrandingOverride);
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
      toast.success(text("Programma-item gewijzigd.", "Itinerary item updated."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text(
              "Programma-item kon niet worden gewijzigd.",
              "Itinerary item could not be updated.",
            ),
      );
      throw error;
    }
  }
  const canMarkBillable = moneyEditable && hasFeature(state.plan, "billable_expenses");
  const canManageReceipts = moneyEditable && hasFeature(state.plan, "receipts");
  const spent = trip.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const billable = trip.expenses
    .filter((e) => e.billable)
    .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const fuelTravelItems = (trip.travelItems ?? []).filter(
    (travelItem) => travelItem.type === "transport" && fuelEstimateFor(travelItem) > 0,
  );
  const estimatedFuel = remainingFuelEstimate(trip.travelItems ?? [], trip.expenses, base, rates);

  const [draft, setDraft] = useState<Omit<Expense, "id">>({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    category: "food",
    amount: 0,
    currency: "EUR",
    paidBy: ownerParticipant.id,
    billable: false,
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string>();
  const [fuelTravelItemId, setFuelTravelItemId] = useState<string>();
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<"all"|ExpenseCategory>("all");
  const [expensePayerFilter, setExpensePayerFilter] = useState("all");
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string>();
  const [sharePin, setSharePin] = useState("");
  const [sharingSaving, setSharingSaving] = useState(false);
  const [settings, setSettings] = useState<TripSettingsDraft>(() => settingsFromTrip(trip));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [activeStopId, setActiveStopId] = useState<string>();
  const visibleStops = showAllStops ? trip.stops : trip.stops.slice(0, 4);
  const visibleExpenses = trip.expenses.filter((expense) =>
    (expenseCategoryFilter === "all" || expense.category === expenseCategoryFilter) &&
    (expensePayerFilter === "all" || resolveParticipantId(expense.paidBy, financialParticipants) === expensePayerFilter) &&
    (!expenseSearch.trim() || `${expense.title} ${expense.notes ?? ""}`.toLocaleLowerCase(locale).includes(expenseSearch.trim().toLocaleLowerCase(locale)))
  );
  const selectStop = useCallback((id: string) => setActiveStopId(id), []);

  useEffect(() => {
    setSettings(settingsFromTrip(trip));
  }, [trip.id, trip.name, trip.description, trip.start, trip.end, trip.budget, trip.template]);

  async function saveTripSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settingsEditable) return;
    const name = settings.name.trim();
    const budget = Number(settings.budget);
    if (!name) {
      toast.error(text("Een reisnaam is verplicht.", "A trip name is required."));
      return;
    }
    if (name.length > TRIP_NAME_MAX_LENGTH) {
      toast.error(
        text(
          `De reisnaam mag maximaal ${TRIP_NAME_MAX_LENGTH} tekens bevatten.`,
          `The trip name can contain up to ${TRIP_NAME_MAX_LENGTH} characters.`,
        ),
      );
      return;
    }
    if (settings.description.trim().length > TRIP_DESCRIPTION_MAX_LENGTH) {
      toast.error(
        text(
          `De reisomschrijving mag maximaal ${TRIP_DESCRIPTION_MAX_LENGTH} tekens bevatten.`,
          `The trip description can contain up to ${TRIP_DESCRIPTION_MAX_LENGTH} characters.`,
        ),
      );
      return;
    }
    if (!settings.start || !settings.end) {
      toast.error(text("Vul een start- en einddatum in.", "Enter a start and end date."));
      return;
    }
    if (settings.end < settings.start) {
      toast.error(
        text(
          "De einddatum kan niet vóór de startdatum liggen.",
          "The end date cannot be before the start date.",
        ),
      );
      return;
    }
    if (!settings.budget.trim() || !Number.isFinite(budget) || budget < 0) {
      toast.error(text("Vul een budget van nul of hoger in.", "Enter a budget of zero or more."));
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
      toast.success(text("Reisinstellingen opgeslagen.", "Trip settings saved."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text(
              "Reisinstellingen konden niet worden opgeslagen.",
              "Trip settings could not be saved.",
            ),
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
    if (!settingsEditable) return;
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
      const expenseId = editingExpenseId ?? uid();
      await saveTripNow(trip.id, (t) => ({
        ...t,
        expenses: editingExpenseId
          ? t.expenses.map((expense) =>
              expense.id === editingExpenseId
                ? { ...draft, billable: canMarkBillable && draft.billable, id: editingExpenseId }
                : expense,
            )
          : [
              ...t.expenses,
              { ...draft, billable: canMarkBillable && draft.billable, id: expenseId },
            ],
        travelItems: linkFuelExpense(
          editingExpenseId
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
            : (t.travelItems ?? []),
          expenseId,
          fuelTravelItemId,
        ),
      }));
      setDraft({ ...draft, title: "", amount: 0, notes: undefined, splitWith: undefined });
      setEditingExpenseId(undefined);
      setFuelTravelItemId(undefined);
      toast.success(
        editingExpenseId
          ? text("Uitgave bijgewerkt", "Expense updated")
          : text("Uitgave geboekt", "Expense added"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Uitgave kon niet worden opgeslagen.", "Expense could not be saved."),
      );
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
            ? text("Onderdeel en gekoppelde kosten bijgewerkt.", "Item and linked expense updated.")
            : text(
                "Onderdeel, kaartlocatie en kosten opgeslagen.",
                "Item, map location and expense saved.",
              )
          : previousId
            ? text("Reisonderdeel bijgewerkt.", "Travel item updated.")
            : text("Onderdeel en kaartlocatie opgeslagen.", "Item and map location saved."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Reisonderdeel kon niet worden opgeslagen.", "Travel item could not be saved."),
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
        item?.expenseId
          ? text("Onderdeel en gekoppelde kosten verwijderd.", "Item and linked expense deleted.")
          : text("Onderdeel verwijderd.", "Item deleted."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Reisonderdeel kon niet worden verwijderd.", "Travel item could not be deleted."),
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
      toast.success(text(`${location.name} toegevoegd.`, `${location.name} added.`));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Bestemming kon niet worden opgeslagen.", "Destination could not be saved."),
      );
    }
  }

  async function removeStop(stopId: string) {
    if (
      !window.confirm(
        text(
          "Deze bestemming van de routekaart verwijderen?",
          "Remove this destination from the route map?",
        ),
      )
    )
      return;
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        stops: current.stops.filter((stop) => stop.id !== stopId),
      }));
      if (activeStopId === stopId) setActiveStopId(undefined);
      toast.success(text("Bestemming verwijderd.", "Destination deleted."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Bestemming kon niet worden verwijderd.", "Destination could not be deleted."),
      );
    }
  }

  async function toggleArchive() {
    if (!settingsEditable) return;
    if (
      !window.confirm(
        trip.archived
          ? text("Deze reis weer actief maken?", "Reactivate this trip?")
          : text("Deze reis archiveren?", "Archive this trip?"),
      )
    ) {
      return;
    }
    try {
      await saveTripNow(trip.id, (current) => ({ ...current, archived: !current.archived }));
      toast.success(
        trip.archived
          ? text("Reis heractiveerd.", "Trip reactivated.")
          : text("Reis gearchiveerd.", "Trip archived."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Reisstatus kon niet worden opgeslagen.", "Trip status could not be saved."),
      );
    }
  }

  async function removeExpense(expenseId: string) {
    if (
      !window.confirm(
        text(
          "Deze uitgave verwijderen? De koppeling met een eventueel reisonderdeel wordt losgemaakt.",
          "Delete this expense? Any link to a travel item will be removed.",
        ),
      )
    ) {
      return;
    }
    try {
      await saveTripNow(trip.id, (current) => ({
        ...current,
        expenses: current.expenses.filter((expense) => expense.id !== expenseId),
        travelItems: linkFuelExpense(
          (current.travelItems ?? []).map((travelItem) =>
            travelItem.expenseId === expenseId
              ? { ...travelItem, expenseId: undefined, amount: undefined }
              : travelItem,
          ),
          expenseId,
        ),
      }));
      toast.success(text("Uitgave verwijderd.", "Expense deleted."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Uitgave kon niet worden verwijderd.", "Expense could not be deleted."),
      );
    }
  }

  async function uploadReceipt(expense: Expense, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!canManageReceipts) {
      toast.error(
        text(
          "Bonnetjes koppelen is beschikbaar in het Agency-plan.",
          "Attaching receipts is available with the Agency plan.",
        ),
      );
      event.target.value = "";
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error(
        text(
          "Kies een PDF, JPG, PNG of WebP tot 10 MB.",
          "Choose a PDF, JPG, PNG or WebP file up to 10 MB.",
        ),
      );
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
      toast.success(text("Bon gekoppeld aan de uitgave.", "Receipt attached to the expense."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Bon kon niet worden geüpload.", "Receipt could not be uploaded."),
      );
    } finally {
      setUploadingReceiptId(undefined);
      event.target.value = "";
    }
  }

  async function openReceipt(expense: Expense) {
    if (!expense.receiptPath) return;
    if (!canManageReceipts) {
      toast.error(
        text(
          "Bonnetjes bekijken is beschikbaar in het Agency-plan.",
          "Viewing receipts is available with the Agency plan.",
        ),
      );
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(expense.receiptPath, 60 * 5);
      if (error) throw error;
      if (!data?.signedUrl)
        throw new Error(text("Bon kon niet worden geopend.", "Receipt could not be opened."));
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Bon kon niet worden geopend.", "Receipt could not be opened."),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
            ← {text("Alle reizen", "All trips")}
          </Link>
          <h1 className="break-anywhere font-display text-2xl font-semibold">{trip.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{tripStatusLabel(tripStatus(trip), text)}</Badge>
            {trip.start} → {trip.end} · {trip.stops.length}{" "}
            {text(
              trip.stops.length === 1 ? "bestemming" : "bestemmingen",
              trip.stops.length === 1 ? "destination" : "destinations",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!moneyEditable}
            onClick={() => {
              downloadCsv(trip, base, rates, locale);
              toast.success(text("CSV geëxporteerd", "CSV exported"));
            }}
          >
            <FileDown className="size-4" /> CSV
          </Button>
          <Button
            variant="outline"
            disabled={false}
            onClick={() => {
              if (!openGuide(trip, base, rates, exportBranding, locale, coverUrl))
                toast.error(
                  text(
                    "Sta pop-ups toe om de reisgids te openen.",
                    "Allow pop-ups to open the trip guide.",
                  ),
                );
            }}
          >
            <BookOpen className="size-4" /> {text("Reisgids", "Trip guide")}
          </Button>
          <Button
            disabled={!moneyEditable}
            onClick={() => {
              if (!hasFeature(state.plan, "pdf_export")) {
                toast.error(
                  text(
                    "PDF-declaraties zitten in Pro en hoger.",
                    "PDF expense reports are available on Pro and above.",
                  ),
                );
                return;
              }
              if (!openPdf(trip, base, rates, exportBranding, locale))
                toast.error(
                  text(
                    "Sta pop-ups toe om de PDF te genereren.",
                    "Allow pop-ups to generate the PDF.",
                  ),
                );
            }}
          >
            <FileText className="size-4" /> PDF {text("declaratie", "expense report")}
          </Button>
        </div>
      </div>

      {tripStatus(trip) === "upcoming" && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {text("Aftellen tot vertrek", "Countdown to departure")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Countdown date={trip.start} />
          </CardContent>
        </Card>
      )}

      <div
        className={`grid gap-4 ${canMarkBillable || estimatedFuel > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <Stat label={text("Uitgegeven", "Spent")} value={formatMoney(spent, base)} />
        <Stat label="Budget" value={formatMoney(trip.budget, base)} />
        {estimatedFuel > 0 && (
          <Stat
            label={text("Brandstofprognose", "Fuel estimate")}
            value={formatMoney(estimatedFuel, base)}
          />
        )}
        {canMarkBillable && (
          <Stat label={text("Declarabel", "Billable")} value={formatMoney(billable, base)} />
        )}
      </div>
      <Progress value={trip.budget ? Math.min(100, (spent / trip.budget) * 100) : 0} />

      <Tabs defaultValue="route">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="today">{text("Vandaag", "Today")}</TabsTrigger>
          <TabsTrigger value="route">{text("Routekaart", "Route map")}</TabsTrigger>
          <TabsTrigger value="plan">{text("Reisschema", "Itinerary")}</TabsTrigger>
          {editable && (
            <TabsTrigger value="plan-edit">
              {text("Reisschema aanpassen", "Edit itinerary")}
            </TabsTrigger>
          )}
          <TabsTrigger value="expenses">{text("Uitgaven", "Expenses")}</TabsTrigger>
          <TabsTrigger value="money">{text("Geld-tools", "Money tools")}</TabsTrigger>
          <TabsTrigger value="packing">{text("Paklijst", "Packing list")}</TabsTrigger>
          <TabsTrigger value="documents">{text("Documenten", "Documents")}</TabsTrigger>
          <TabsTrigger value="settings">{text("Instellingen", "Settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4"><TripToday trip={trip} editable={editable} weatherEnabled={hasFeature(state.plan, "weather")} text={text}/></TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Tabs defaultValue="general"><TabsList className="h-auto flex-wrap justify-start"><TabsTrigger value="general">{text("Algemeen","General")}</TabsTrigger><TabsTrigger value="notifications">{text("Meldingen","Notifications")}</TabsTrigger>{state.plan==="agency"&&<TabsTrigger value="branding">{text("Huisstijl","Branding")}</TabsTrigger>}<TabsTrigger value="sharing">{text("Delen","Sharing")}</TabsTrigger><TabsTrigger value="members">{text("Reisgenoten","Travellers")}</TabsTrigger><TabsTrigger value="danger">{text("Beheer","Management")}</TabsTrigger></TabsList>
          <TabsContent value="general" className="mt-4 space-y-4"><TripCover tripId={trip.id} editable={editable} text={text} onUrlChange={setCoverUrl}/><Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="size-4" /> {text("Reisinstellingen", "Trip settings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveTripSettings}>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">{text("Reisnaam", "Trip name")}</span>
                  <Input
                    value={settings.name}
                    maxLength={TRIP_NAME_MAX_LENGTH}
                    disabled={!settingsEditable || settingsSaving}
                    required
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <span className="block text-right text-xs text-muted-foreground">
                    {settings.name.length}/{TRIP_NAME_MAX_LENGTH}
                  </span>
                </label>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">
                    {text("Reisomschrijving", "Trip description")}
                  </span>
                  <Textarea
                    value={settings.description}
                    disabled={!settingsEditable || settingsSaving}
                    maxLength={TRIP_DESCRIPTION_MAX_LENGTH}
                    rows={4}
                    placeholder={text(
                      "Vertel kort wat deze reis bijzonder maakt. Deze tekst verschijnt ook op de publieke reispagina.",
                      "Briefly describe what makes this trip special. This text also appears on the public trip page.",
                    )}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                  <span className="block text-right text-xs text-muted-foreground">
                    {settings.description.length}/{TRIP_DESCRIPTION_MAX_LENGTH}
                  </span>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">{text("Startdatum", "Start date")}</span>
                  <Input
                    type="date"
                    value={settings.start}
                    disabled={!settingsEditable || settingsSaving}
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
                  <span className="text-muted-foreground">{text("Einddatum", "End date")}</span>
                  <Input
                    type="date"
                    value={settings.end}
                    min={settings.start || undefined}
                    disabled={!settingsEditable || settingsSaving}
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
                    disabled={!settingsEditable || settingsSaving}
                    required
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, budget: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {text("Reistemplate", "Trip template")}
                  </span>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.template}
                    disabled={!settingsEditable || settingsSaving}
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
                  <Button type="submit" disabled={!settingsEditable || settingsSaving}>
                    {settingsSaving
                      ? text("Opslaan…", "Saving…")
                      : text("Wijzigingen opslaan", "Save changes")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card></TabsContent>

          <TabsContent value="notifications" className="mt-4"><TripNotificationPreferences tripId={trip.id} /></TabsContent>

          {state.plan === "agency" && (
            <TabsContent value="branding" className="mt-4 space-y-4"><TripTemplateApply trip={trip} editable={editable} save={(fn)=>saveTripNow(trip.id,fn)} /><TripBrandingSettings tripId={trip.id} agencyBranding={state.branding} onSaved={setExportBrandingOverride} /></TabsContent>
          )}

          <TabsContent value="sharing" className="mt-4"><Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe2 className="size-4" /> {text("Openbaar delen", "Public sharing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ToggleSetting
                label={text("Reis openbaar maken", "Make trip public")}
                description={text(
                  "Toon deze reis op de homepage via een unieke link.",
                  "Show this trip on the homepage through a unique link.",
                )}
                checked={trip.public ?? false}
                disabled={!settingsEditable || sharingSaving}
                onChange={(checked) =>
                  void saveSharing(
                    { isPublic: checked },
                    checked
                      ? text("Reis is openbaar gemaakt.", "Trip is now public.")
                      : text("Reis is privé gemaakt.", "Trip is now private."),
                  )
                }
              />
              {trip.public && (
                <>
                  <ToggleSetting
                    label={text("Budget delen", "Share budget")}
                    description={text(
                      "Toon het budget op de openbare reispagina.",
                      "Show the budget on the public trip page.",
                    )}
                    checked={trip.shareFinancials ?? false}
                    disabled={!settingsEditable || sharingSaving}
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
                        disabled={!settingsEditable || sharingSaving}
                        onChange={(e) => setSharePin(e.target.value.replace(/\D/g, ""))}
                        placeholder={trip.sharePinHash ? "Nieuwe PIN" : "Kies een PIN"}
                      />
                      <Button
                        variant="outline"
                        disabled={!settingsEditable || sharingSaving || sharePin.length < 6}
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
                          disabled={!settingsEditable || sharingSaving}
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
          </Card></TabsContent>

          <TabsContent value="members" className="mt-4"><TripMembers
            members={trip.members ?? []}
            tripId={trip.id}
            plan={state.plan}
            editable={mayManageMembers}
            ownerName={ownerName}
            ownerEmail={user?.email ?? "Eigenaar van deze reis"}
            onChange={(members) =>
              saveTripNow(trip.id, (current) => ({
                ...current,
                expenses: current.expenses.map((expense) =>
                  normalizeExpenseParticipants(expense, financialParticipants),
                ),
                members,
                travelers: [ownerName, ...members.map((member) => member.name)],
              }))
            }
          /></TabsContent>

          <TabsContent value="danger" className="mt-4"><Card className="border-destructive/40 surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{text("Reisbeheer en exports", "Trip management and exports")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                {text(
                  "Archiveer de reis of verwijder hem definitief.",
                  "Archive the trip or delete it permanently.",
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    downloadTripCalendar(trip);
                    toast.success(text("Reisagenda gedownload", "Trip calendar downloaded"));
                  }}
                >
                  <CalendarDays className="size-4" /> {text("Agenda exporteren", "Export calendar")}
                </Button>
                <Button
                  variant="outline"
                  disabled={!settingsEditable}
                  onClick={() => void toggleArchive()}
                >
                  <Archive className="size-4" />{" "}
                  {trip.archived
                    ? text("Heractiveren", "Reactivate")
                    : text("Archiveren", "Archive")}
                </Button>
                <Button
                  variant="outline"
                  disabled={!tripOwner}
                  onClick={() => {
                    downloadJson({ trips: [trip] }, trip.name);
                    toast.success(text("Reisback-up gedownload", "Trip backup downloaded"));
                  }}
                >
                  <Download className="size-4" /> {text("Back-up downloaden", "Download backup")}
                </Button>
                <Button
                  variant="outline"
                  disabled={!tripOwner}
                  onClick={async () => {
                    let newId: string | undefined;
                    try {
                      const name = duplicateTripName(trip.name, text("kopie", "copy"), TRIP_NAME_MAX_LENGTH);
                      newId = await addTrip(name, trip.template);
                      await saveTripNow(newId, (created) => ({ ...buildTripDuplicate(trip, created, () => crypto.randomUUID()), name }));
                      toast.success(text("Reisvariant aangemaakt", "Trip variant created"));
                      navigate({ to: "/trips/$tripId", params: { tripId: newId } });
                    } catch (error) {
                      if (newId) await removeTrip(newId).catch(() => undefined);
                      toast.error(error instanceof Error ? error.message : text("De reis kon niet worden gekopieerd.", "The trip could not be copied."));
                    }
                  }}
                >
                  <Copy className="size-4" /> {text("Reis dupliceren", "Duplicate trip")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!tripOwner}
                  onClick={async () => {
                    if (
                      window.confirm(
                        text(
                          `Weet je zeker dat je ${trip.name} definitief wilt verwijderen?`,
                          `Are you sure you want to permanently delete ${trip.name}?`,
                        ),
                      )
                    ) {
                      try {
                        await removeTrip(trip.id);
                        toast.success(text("Reis verwijderd", "Trip deleted"));
                        navigate({ to: "/dashboard" });
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : text(
                                "Reis kon niet worden verwijderd.",
                                "Trip could not be deleted.",
                              ),
                        );
                      }
                    }
                  }}
                >
                  <Trash2 className="size-4" /> {text("Verwijderen", "Delete")}
                </Button>
              </div>
            </CardContent>
          </Card></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="packing">
          <Packing
            items={trip.packing ?? []}
            editable={editable}
            onChange={(next) => saveTripNow(trip.id, (t) => ({ ...t, packing: next }))}
          />
        </TabsContent>

        <TabsContent value="documents">
          <TripDocuments tripId={trip.id} editable={editable} />
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
                      points={(trip.travelItems ?? []).flatMap((item) => {
                        const location = item.location ?? item.departure ?? item.arrival;
                        if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return [];
                        const expense = item.expenseId ? trip.expenses.find((entry) => entry.id === item.expenseId) : undefined;
                        return [
                          { id: `booking-${item.id}`, lat: location.lat, lon: location.lon, title: item.title, detail: item.provider, kind: "booking" as const },
                          ...(expense ? [{ id: `expense-${expense.id}`, lat: location.lat, lon: location.lon, title: expense.title, detail: formatMoney(expense.amount, expense.currency), kind: "expense" as const }] : []),
                        ];
                      })}
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
                  <CardTitle className="text-sm">
                    {text("Bestemming toevoegen", "Add destination")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PlaceSearch disabled={!editable} onPick={(location) => void addStop(location)} />
                  {trip.stops.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {trip.stops.length}{" "}
                      {text(
                        trip.stops.length === 1 ? "bestemming" : "bestemmingen",
                        trip.stops.length === 1 ? "destination" : "destinations",
                      )}
                      {activeStopId
                        ? text(
                            " · geselecteerde bestemming is op de kaart uitgelicht",
                            " · selected destination is highlighted on the map",
                          )
                        : ""}
                    </p>
                  )}
                  <ul className="space-y-2">
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
                            <span className="ml-2 text-xs text-muted-foreground">
                              {localizeCountry(s.country, locale)}
                            </span>
                          </button>
                          {editable && (
                            <button
                              type="button"
                              aria-label={text("Verwijder bestemming", "Delete destination")}
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
                  </ul>
                  {trip.stops.length > 4 && (
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllStops((current) => !current)}
                    >
                      {showAllStops
                        ? text("Minder bestemmingen tonen", "Show fewer destinations")
                        : text(
                            `Alle ${trip.stops.length} bestemmingen tonen`,
                            `Show all ${trip.stops.length} destinations`,
                          )}
                    </Button>
                  )}
                  {trip.stops.length > 0 && <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { downloadTripGpx(trip); toast.success(text("GPX-route gedownload", "GPX route downloaded")); }}><Download className="size-4"/>{text("GPX exporteren", "Export GPX")}</Button>
                    <Button type="button" variant="outline" size="sm" disabled={!editable || trip.stops.length < 2} onClick={async () => { if (!window.confirm(text("Wil je de volledige volgorde van de bestemmingen omkeren?", "Reverse the complete destination order?"))) return; try { await saveTripNow(trip.id, (current) => ({ ...current, stops: [...current.stops].reverse() })); setActiveStopId(undefined); toast.success(text("Route omgekeerd", "Route reversed")); } catch { toast.error(text("De route kon niet worden omgekeerd.", "The route could not be reversed.")); } }}><ArrowDownUp className="size-4"/>{text("Route omkeren", "Reverse route")}</Button>
                  </div>}
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
          <TripTasks tripId={trip.id} editable={editable} text={text} />
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
            payers={financialParticipants}
            onSave={saveTravelItem}
            onRemove={removeTravelItem}
            initialItem={editingBooking}
            onFinish={() => setEditingBooking(null)}
          />
        )}

        {editable && (
          <TabsContent value="plan-edit" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {text(
                "Voeg boekingen en eigen programma-items toe of wijzig ze. Het overzicht zelf staat in Reisschema.",
                "Add or edit bookings and your own itinerary items. The overview is available under Itinerary.",
              )}
            </p>
            <Tabs defaultValue="bookings">
              <TabsList className="h-auto flex-wrap justify-start"><TabsTrigger value="bookings">{text("Geboekte onderdelen","Booked items")}</TabsTrigger><TabsTrigger value="days">{text("Dagplanning","Day planning")}</TabsTrigger></TabsList>
              <TabsContent value="bookings" className="mt-4"><TripBookings
              trip={trip}
              editable={editable}
              payers={financialParticipants}
              onSave={saveTravelItem}
              onRemove={removeTravelItem}
              /></TabsContent>
              <TabsContent value="days" className="mt-4"><TripTimeline
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
                  toast.success(text("Programma-item opgeslagen.", "Itinerary item saved."));
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : text(
                          "Programma-item kon niet worden opgeslagen.",
                          "Itinerary item could not be saved.",
                        ),
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
                  toast.success(text("Programma-item verwijderd.", "Itinerary item deleted."));
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : text(
                          "Programma-item kon niet worden verwijderd.",
                          "Itinerary item could not be deleted.",
                        ),
                  );
                  throw error;
                }
              }}
              /></TabsContent>
            </Tabs>
          </TabsContent>
        )}

        <TabsContent value="expenses" className="space-y-4">
          <Card className="surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {editingExpenseId
                  ? text("Uitgave wijzigen", "Edit expense")
                  : text("Uitgave boeken (elke valuta)", "Add expense (any currency)")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid items-end gap-3 md:grid-cols-7">
                <Input
                  type="date"
                  value={draft.date}
                  disabled={!moneyEditable}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
                <Input
                  className="md:col-span-2"
                  value={draft.title}
                  disabled={!moneyEditable}
                  placeholder={text("Omschrijving", "Description")}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
                <select
                  aria-label={text("Categorie", "Category")}
                  className="rounded-lg border border-input bg-card px-3 text-sm"
                  value={draft.category}
                  disabled={!moneyEditable}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as ExpenseCategory })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {expenseCategoryLabel(c.id, c.label, text)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={text("Betaald door", "Paid by")}
                  className="rounded-lg border border-input bg-card px-3 text-sm"
                  value={draft.paidBy}
                  disabled={!moneyEditable}
                  onChange={(e) => setDraft({ ...draft, paidBy: e.target.value })}
                >
                  {financialParticipants.map((payer) => (
                    <option key={payer.id} value={payer.id}>
                      {text("Betaald door", "Paid by")}: {payer.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  value={draft.amount || ""}
                  disabled={!moneyEditable}
                  placeholder={text("Bedrag", "Amount")}
                  onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
                />
                <select
                  aria-label="Valuta"
                  className="rounded-lg border border-input bg-card px-3 text-sm"
                  value={draft.currency}
                  disabled={!moneyEditable}
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
                      disabled={!moneyEditable}
                      onChange={(e) => setDraft({ ...draft, billable: e.target.checked })}
                    />
                    {text("Declarabel bij klant", "Billable to client")}
                  </label>
                )}
              </div>
              {fuelTravelItems.length > 0 && (
                <div className="grid gap-2 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_minmax(15rem,1fr)] md:items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {text("Werkelijke brandstofkosten", "Actual fuel costs")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {text(
                        "Koppel een tankuitgave aan een rit om de prognose voor die rit te vervangen.",
                        "Link a fuel expense to a drive to replace that drive's estimate.",
                      )}
                    </p>
                  </div>
                  <select
                    aria-label={text("Brandstofprognose vervangen", "Replace fuel estimate")}
                    className="min-h-10 min-w-0 rounded-lg border border-input bg-card px-3 text-sm"
                    value={fuelTravelItemId ?? ""}
                    disabled={!moneyEditable}
                    onChange={(event) => {
                      const selectedId = event.target.value || undefined;
                      setFuelTravelItemId(selectedId);
                      if (selectedId) setDraft({ ...draft, category: "transport" });
                    }}
                  >
                    <option value="">
                      {text("Geen prognose vervangen", "Do not replace an estimate")}
                    </option>
                    {fuelTravelItems.map((travelItem) => (
                      <option key={travelItem.id} value={travelItem.id}>
                        {travelItem.title} ·{" "}
                        {formatMoney(
                          fuelEstimateFor(travelItem),
                          travelItem.details?.fuelCurrency ?? travelItem.currency ?? base,
                        )}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {text("Verdelen tussen", "Split between")}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {financialParticipants.map((traveler) => {
                    const selected =
                      !draft.splitWith?.length ||
                      draft.splitWith.some(
                        (value) =>
                          resolveParticipantId(value, financialParticipants) === traveler.id,
                      );
                    return (
                      <label key={traveler.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!moneyEditable}
                          onChange={(event) => {
                            const current = draft.splitWith?.length
                              ? draft.splitWith
                              : financialParticipants.map((participant) => participant.id);
                            const splitWith = event.target.checked
                              ? Array.from(new Set([...current, traveler.id]))
                              : current.filter(
                                  (person) =>
                                    resolveParticipantId(person, financialParticipants) !==
                                    traveler.id,
                                );
                            setDraft({ ...draft, splitWith });
                          }}
                        />
                        {traveler.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Input
                value={draft.notes ?? ""}
                disabled={!moneyEditable}
                placeholder={text("Notitie (optioneel)", "Note (optional)")}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value || undefined })}
              />
              <div className="flex flex-wrap justify-end gap-2">
                {editingExpenseId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingExpenseId(undefined);
                      setFuelTravelItemId(undefined);
                      setDraft({
                        date: new Date().toISOString().slice(0, 10),
                        title: "",
                        category: "food",
                        amount: 0,
                        currency: base,
                        paidBy: ownerParticipant.id,
                        billable: false,
                      });
                    }}
                  >
                    {text("Annuleren", "Cancel")}
                  </Button>
                )}
                <Button
                  onClick={() => void addExpense()}
                  disabled={!moneyEditable || expenseSaving}
                >
                  <Plus className="size-4" />{" "}
                  {expenseSaving
                    ? text("Opslaan…", "Saving…")
                    : editingExpenseId
                      ? text("Opslaan", "Save")
                      : text("Boeken", "Add")}{" "}
                  ({formatMoney(convert(draft.amount || 0, draft.currency, base, rates), base)})
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={expenseSearch} onChange={(event)=>setExpenseSearch(event.target.value)} placeholder={text("Zoek in uitgaven…","Search expenses…")} aria-label={text("Uitgaven zoeken","Search expenses")}/>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={expenseCategoryFilter} onChange={(event)=>setExpenseCategoryFilter(event.target.value as "all"|ExpenseCategory)} aria-label={text("Filter op categorie","Filter by category")}><option value="all">{text("Alle categorieën","All categories")}</option>{CATEGORIES.map(category=><option key={category.id} value={category.id}>{expenseCategoryLabel(category.id,category.label,text)}</option>)}</select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={expensePayerFilter} onChange={(event)=>setExpensePayerFilter(event.target.value)} aria-label={text("Filter op betaler","Filter by payer")}><option value="all">{text("Alle betalers","All payers")}</option>{financialParticipants.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select>
          </div>
          <p className="text-xs text-muted-foreground">{text(`${visibleExpenses.length} van ${trip.expenses.length} uitgaven`,`${visibleExpenses.length} of ${trip.expenses.length} expenses`)}</p>

          <Card className="surface min-w-0 overflow-hidden">
            <CardContent
              className="overflow-x-auto p-0"
              tabIndex={0}
              role="region"
              aria-label={text("Uitgavenoverzicht", "Expense overview")}
            >
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">{text("Datum", "Date")}</th>
                    <th className="p-3">{text("Omschrijving", "Description")}</th>
                    <th className="p-3">{text("Categorie", "Category")}</th>
                    <th className="p-3">{text("Betaald door", "Paid by")}</th>
                    <th className="p-3 text-right">{text("Origineel", "Original")}</th>
                    <th className="p-3 text-right">{base}</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-3 whitespace-nowrap">{e.date}</td>
                      <td className="p-3">
                        {e.title}
                        {canMarkBillable && e.billable && (
                          <Badge variant="secondary" className="ml-2">
                            {text("declarabel", "billable")}
                          </Badge>
                        )}
                        {fuelTravelItemIdForExpense(trip.travelItems ?? [], e.id) && (
                          <Badge variant="outline" className="ml-2">
                            {text("werkelijke brandstof", "actual fuel")}
                          </Badge>
                        )}
                        {canManageReceipts && e.receiptPath && (
                          <button
                            type="button"
                            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                            onClick={() => void openReceipt(e)}
                          >
                            <Paperclip className="size-3" />{" "}
                            {e.receiptName || text("Bon bekijken", "View receipt")}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        {expenseCategoryLabel(
                          e.category,
                          CATEGORIES.find((c) => c.id === e.category)?.label ?? e.category,
                          text,
                        )}
                      </td>
                      <td className="p-3">{participantName(e.paidBy, financialParticipants)}</td>
                      <td className="p-3 text-right">
                        {e.amount.toFixed(2)} {e.currency}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatMoney(convert(e.amount, e.currency, base, rates), base)}
                      </td>
                      <td className="p-3 text-right">
                        {moneyEditable && (
                          <span className="inline-flex">
                            {canManageReceipts && (
                              <label
                                className={`grid size-7 cursor-pointer place-items-center rounded text-muted-foreground hover:text-foreground ${
                                  uploadingReceiptId === e.id
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }`}
                                title={text("Bon koppelen", "Attach receipt")}
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
                              aria-label={text("Wijzig uitgave", "Edit expense")}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingExpenseId(e.id);
                                setFuelTravelItemId(
                                  fuelTravelItemIdForExpense(trip.travelItems ?? [], e.id),
                                );
                                setDraft(normalizeExpenseParticipants(e, financialParticipants));
                              }}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              aria-label={text("Verwijder uitgave", "Delete expense")}
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
          <TripInsights trip={trip} base={base} rates={rates} text={text} />
          <div className="grid gap-4 lg:grid-cols-2">
            <CurrencyConverter rates={rates} base={base} live={ratesLive} />
            <FuelCalculator rates={rates} base={base} />
          </div>
          <Settlement
            trip={trip}
            base={base}
            rates={rates}
            editable={moneyEditable}
            owner={ownerParticipant}
            manageTravelersInSettings
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function tripStatusLabel(
  status: ReturnType<typeof tripStatus>,
  text: (nl: string, en: string) => string,
) {
  if (status === "current") return text("Huidig", "Current");
  if (status === "upcoming") return text("Aankomend", "Upcoming");
  return text("Gearchiveerd", "Archived");
}

function expenseCategoryLabel(
  id: string,
  fallback: string,
  text: (nl: string, en: string) => string,
) {
  const labels: Record<string, string> = {
    transport: "Transport",
    lodging: "Accommodation",
    food: "Food and drink",
    activities: "Activities",
    shopping: "Shopping",
    other: "Other",
  };
  return text(fallback, labels[id] ?? fallback);
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
