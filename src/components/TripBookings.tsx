import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Car,
  Globe2,
  Loader2,
  MapPin,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Ticket,
  TrainFront,
  Trash2,
} from "lucide-react";
import { lookupFlight, type FlightLookup } from "@/lib/flight.functions";
import { CURRENCIES, formatMoney } from "@/lib/services";
import type { GeoResult } from "@/lib/services";
import type { TransportMode, TravelItem, TravelItemType, Trip } from "@/lib/types";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale";
import { localizeCountry } from "@/lib/localized-values";
import { resolveParticipantId, type FinancialParticipant } from "@/lib/settle";
import { transportModeUsesOwnFuel } from "@/lib/fuel-costs";

const TYPES: { id: TravelItemType; label: string; icon: typeof Plane }[] = [
  { id: "flight", label: "Vlucht", icon: Plane },
  { id: "lodging", label: "Overnachting", icon: BedDouble },
  { id: "car_rental", label: "Huurauto", icon: Car },
  { id: "transport", label: "Reis / vervoer", icon: TrainFront },
  { id: "activity", label: "Activiteit", icon: Ticket },
];
const TRANSPORT_MODES: { id: TransportMode; nl: string; en: string }[] = [
  { id: "car", nl: "Auto", en: "Car" },
  { id: "motorcycle", nl: "Motor", en: "Motorcycle" },
  { id: "camper", nl: "Camper", en: "Camper" },
  { id: "public_transport", nl: "Openbaar vervoer", en: "Public transport" },
  { id: "train", nl: "Trein", en: "Train" },
  { id: "bus", nl: "Bus", en: "Bus" },
  { id: "ferry", nl: "Veerboot", en: "Ferry" },
  { id: "taxi", nl: "Taxi / deelrit", en: "Taxi / rideshare" },
  { id: "bicycle", nl: "Fiets", en: "Bicycle" },
  { id: "walking", nl: "Lopen", en: "Walking" },
  { id: "other", nl: "Anders", en: "Other" },
];
type Draft = Omit<TravelItem, "id" | "departure" | "arrival" | "location" | "amount"> & {
  amount: string;
};
const emptyDraft = (date: string): Draft => ({
  type: "flight",
  title: "",
  date,
  amount: "",
  currency: "EUR",
  details: {},
});
const moving = (type: TravelItemType) => ["flight", "transport", "car_rental"].includes(type);
const dateLabel = (type: TravelItemType) =>
  type === "flight"
    ? "Vluchtdatum"
    : type === "lodging"
      ? "Incheckdatum"
      : type === "car_rental"
        ? "Ophaaldatum"
        : "Datum";
const endDateLabel = (type: TravelItemType) =>
  type === "lodging" ? "Uitcheckdatum" : type === "car_rental" ? "Inleverdatum" : "Einddatum";
const dateLabelEn = (type: TravelItemType) =>
  type === "flight"
    ? "Flight date"
    : type === "lodging"
      ? "Check-in date"
      : type === "car_rental"
        ? "Collection date"
        : "Date";
const endDateLabelEn = (type: TravelItemType) =>
  type === "lodging" ? "Check-out date" : type === "car_rental" ? "Return date" : "End date";
function travelTypeLabel(
  type: TravelItemType,
  fallback: string,
  text: (nl: string, en: string) => string,
) {
  const english: Record<TravelItemType, string> = {
    flight: "Flight",
    lodging: "Accommodation",
    car_rental: "Rental car",
    transport: "Travel / transport",
    activity: "Activity",
  };
  return text(fallback, english[type]);
}

export function TripBookings({
  trip,
  editable,
  payers,
  onSave,
  onRemove,
  initialItem,
  onFinish,
}: {
  trip: Trip;
  editable: boolean;
  payers: FinancialParticipant[];
  initialItem?: TravelItem;
  onFinish?: () => void;
  onSave: (
    item: TravelItem,
    locations: GeoResult[],
    paidBy: string,
    previousId?: string,
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { locale, text } = useLocale();
  const [draft, setDraft] = useState<Draft>(() =>
    initialItem
      ? {
          ...initialItem,
          amount: initialItem.amount === undefined ? "" : String(initialItem.amount),
        }
      : emptyDraft(trip.start),
  );
  const [departure, setDeparture] = useState<GeoResult | undefined>(initialItem?.departure);
  const [arrival, setArrival] = useState<GeoResult | undefined>(initialItem?.arrival);
  const [location, setLocation] = useState<GeoResult | undefined>(initialItem?.location);
  const [flight, setFlight] = useState<FlightLookup>();
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paidBy, setPaidBy] = useState(
    () =>
      resolveParticipantId(
        trip.expenses.find((expense) => expense.id === initialItem?.expenseId)?.paidBy ?? "",
        payers,
      ) ||
      payers[0]?.id ||
      "Ik",
  );
  const [editingId, setEditingId] = useState<string | undefined>(initialItem?.id);
  const typeIsMoving = moving(draft.type);
  const hasLegacyFuelDetails =
    !draft.details?.transportMode &&
    (Number(draft.details?.consumptionPer100Km ?? 0) > 0 ||
      Number(draft.details?.fuelPricePerLiter ?? 0) > 0);
  const transportUsesFuel =
    transportModeUsesOwnFuel(draft.details?.transportMode) || hasLegacyFuelDetails;
  const Icon = TYPES.find((type) => type.id === draft.type)?.icon ?? Ticket;
  const fuelEstimate = useMemo(() => {
    const d = draft.details;
    const liters = (Number(d?.distanceKm ?? 0) * Number(d?.consumptionPer100Km ?? 0)) / 100;
    return { liters, cost: liters * Number(d?.fuelPricePerLiter ?? 0) };
  }, [draft.details]);
  useEffect(() => {
    if (!payers.some((payer) => payer.id === paidBy)) setPaidBy(payers[0]?.id ?? "Ik");
  }, [paidBy, payers]);
  const detail = (
    key: keyof NonNullable<TravelItem["details"]>,
    value: string | number | boolean,
  ) => setDraft((current) => ({ ...current, details: { ...current.details, [key]: value } }));
  const reset = (date = trip.start) => {
    setDraft(emptyDraft(date));
    setDeparture(undefined);
    setArrival(undefined);
    setLocation(undefined);
    setFlight(undefined);
    setEditingId(undefined);
    setPaidBy(payers[0]?.id ?? "Ik");
    onFinish?.();
  };
  async function refreshFlight() {
    if (!draft.flightNumber?.trim()) {
      toast.error(
        text(
          "Vul eerst een vluchtnummer in, bijvoorbeeld KL1234.",
          "Enter a flight number first, for example KL1234.",
        ),
      );
      return;
    }
    setLoadingFlight(true);
    try {
      const result = await lookupFlight({
        data: {
          flightNumber: draft.flightNumber,
          flightDate: draft.date,
          departureIata:
            draft.details?.flightDepartureIata ||
            (/^[A-Za-z]{3}$/.test(draft.details?.flightDepartureAirport ?? "")
              ? draft.details?.flightDepartureAirport
              : undefined),
        },
      });
      setFlight(result);
      setDraft((current) => ({
        ...current,
        flightNumber: result.flightNumber,
        flightStatus: result.status,
        provider: current.provider || result.airline,
        title: current.title || [result.airline, result.flightNumber].filter(Boolean).join(" "),
        details: {
          ...current.details,
          startTime:
            current.details?.startTime || result.departure?.actual || result.departure?.scheduled,
          endTime:
            current.details?.endTime || result.arrival?.estimated || result.arrival?.scheduled,
          flightDepartureAirport: result.departure?.airportFull || result.departure?.airport,
          flightDepartureIata:
            current.details?.flightDepartureIata ||
            (/^[A-Za-z]{3}$/.test(result.departure?.airport ?? "")
              ? result.departure?.airport?.toUpperCase()
              : undefined),
          flightArrivalAirport: result.arrival?.airportFull || result.arrival?.airport,
          flightDepartureScheduled: result.departure?.scheduled,
          flightDepartureActual: result.departure?.actual,
          flightDepartureTerminal: result.departure?.terminal,
          flightDepartureGate: result.departure?.gate,
          flightDepartureCheckin: result.departure?.checkin,
          flightArrivalScheduled: result.arrival?.scheduled,
          flightArrivalEstimated: result.arrival?.estimated,
          flightArrivalTerminal: result.arrival?.terminal,
          flightArrivalGate: result.arrival?.gate,
          flightArrivalBaggage: result.arrival?.baggage,
          flightLastCheckedAt: new Date().toISOString(),
        },
      }));
      toast.success(text("Live vluchtinformatie bijgewerkt.", "Live flight information updated."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Vluchtdata kon niet worden opgehaald.", "Flight data could not be retrieved."),
      );
    } finally {
      setLoadingFlight(false);
    }
  }
  async function save() {
    if (!editable || saving || loadingFlight) return;
    const title = draft.title.trim();
    if (!title || !draft.date) {
      toast.error(text("Vul minstens een naam en datum in.", "Enter at least a name and date."));
      return;
    }
    if (draft.type === "transport" && !draft.details?.transportMode && !editingId) {
      toast.error(text("Kies eerst een vervoerssoort.", "Choose a mode of transport first."));
      return;
    }
    if (draft.type !== "flight" && draft.endDate && draft.endDate < draft.date) {
      toast.error(
        text(
          "De einddatum kan niet vóór de startdatum liggen.",
          "The end date cannot be before the start date.",
        ),
      );
      return;
    }
    const amount = Number(draft.amount);
    const locations = typeIsMoving
      ? [departure, arrival].filter((v): v is GeoResult => Boolean(v))
      : [location].filter((v): v is GeoResult => Boolean(v));
    setSaving(true);
    try {
      await onSave(
        {
          ...draft,
          id: editingId ?? crypto.randomUUID(),
          title,
          amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
          endDate: draft.type === "flight" ? undefined : draft.endDate || undefined,
          departure: typeIsMoving ? departure : undefined,
          arrival: typeIsMoving ? arrival : undefined,
          location: !typeIsMoving ? location : undefined,
        },
        locations,
        paidBy,
        editingId,
      );
      reset(draft.date);
    } catch {
      // The parent shows the precise server error and has restored the prior state.
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (
      !window.confirm(
        text(
          "Dit reisonderdeel verwijderen? Een gekoppelde uitgave wordt ook verwijderd.",
          "Delete this travel item? A linked expense will also be deleted.",
        ),
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await onRemove(id);
      if (editingId === id) reset();
    } catch {
      // The parent shows the precise server error and has restored the prior state.
    } finally {
      setSaving(false);
    }
  }
  function edit(item: TravelItem) {
    const { id: _id, departure: _dep, arrival: _arr, location: _loc, amount, ...rest } = item;
    setEditingId(item.id);
    setDraft({
      ...rest,
      amount: amount === undefined ? "" : String(amount),
      details: item.details ?? {},
    });
    setDeparture(item.departure);
    setArrival(item.arrival);
    setLocation(item.location);
    setPaidBy(
      resolveParticipantId(
        trip.expenses.find((expense) => expense.id === item.expenseId)?.paidBy ?? "",
        payers,
      ) ||
        payers[0]?.id ||
        "Ik",
    );
    setFlight(undefined);
  }
  const form = (
    <Card className="surface">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />{" "}
          {editingId
            ? text("Reisonderdeel wijzigen", "Edit travel item")
            : text("Reisonderdeel toevoegen", "Add travel item")}
        </CardTitle>
        {editingId && (
          <Button
            size="sm"
            variant="ghost"
            disabled={saving || loadingFlight}
            onClick={() => reset(draft.date)}
          >
            {text("Annuleren", "Cancel")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <fieldset disabled={saving || loadingFlight} className="space-y-4 min-w-0">
          <div className="grid items-end gap-3 md:grid-cols-4">
            <Field label={text("Type", "Type")}>
              <select
                aria-label={text("Type reisonderdeel", "Travel item type")}
                className="form-control"
                value={draft.type}
                disabled={!editable}
                onChange={(e) => {
                  const type = e.target.value as TravelItemType;
                  setDraft((current) => ({
                    ...current,
                    type,
                    endDate: type === "flight" ? undefined : current.endDate,
                  }));
                  setFlight(undefined);
                }}
              >
                {TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {travelTypeLabel(type.id, type.label, text)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={text(dateLabel(draft.type), dateLabelEn(draft.type))}>
              <Input
                type="date"
                value={draft.date}
                min={trip.start || undefined}
                max={trip.end || undefined}
                disabled={!editable}
                onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))}
              />
            </Field>
            {draft.type === "flight" ? (
              <Field label={text("Vluchtnummer", "Flight number")}>
                <Input
                  value={draft.flightNumber ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. KL1234"
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, flightNumber: e.target.value }))
                  }
                />
              </Field>
            ) : (
              <Field label={text(endDateLabel(draft.type), endDateLabelEn(draft.type))}>
                <Input
                  type="date"
                  value={draft.endDate ?? ""}
                  min={draft.date || undefined}
                  max={trip.end || undefined}
                  disabled={!editable}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, endDate: e.target.value || undefined }))
                  }
                />
              </Field>
            )}
            {draft.type === "flight" ? (
              <Field label={text("Live vluchtinformatie", "Live flight information")}>
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  disabled={!editable || loadingFlight}
                  onClick={refreshFlight}
                >
                  {loadingFlight ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}{" "}
                  {text("Live vluchtdata", "Live flight data")}
                </Button>
              </Field>
            ) : (
              <Field
                label={
                  draft.type === "activity"
                    ? text("Naam activiteit", "Activity name")
                    : draft.type === "lodging"
                      ? text("Hotelnaam", "Hotel name")
                      : draft.type === "car_rental"
                        ? text("Huurauto / reservering", "Rental car / reservation")
                        : text("Naam / verbinding", "Name / connection")
                }
              >
                <Input
                  value={draft.title}
                  disabled={!editable}
                  placeholder={text("Naam", "Name")}
                  onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                />
              </Field>
            )}
          </div>
          {draft.type === "flight" && (
            <div className="grid items-end gap-3 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-4">
              <Field label={text("Vertrekcode (IATA)", "Departure code (IATA)")}>
                <Input
                  value={draft.details?.flightDepartureIata ?? ""}
                  maxLength={3}
                  disabled={!editable}
                  placeholder="AMS"
                  className="uppercase"
                  onChange={(event) =>
                    detail(
                      "flightDepartureIata",
                      event.target.value
                        .replace(/[^a-z]/gi, "")
                        .toUpperCase()
                        .slice(0, 3),
                    )
                  }
                />
              </Field>
              <Field label={text("Titel", "Title")}>
                <Input
                  value={draft.title}
                  disabled={!editable}
                  placeholder={text("Wordt automatisch ingevuld", "Filled automatically")}
                  onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                />
              </Field>
              <Field label={text("Vertrektijd", "Departure time")}>
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field label={text("Aankomsttijd", "Arrival time")}>
                <Input
                  type="time"
                  value={draft.details?.endTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("endTime", e.target.value)}
                />
              </Field>
              {flight && <FlightStatusSummary flight={flight} />}
            </div>
          )}
          {draft.type === "activity" && (
            <div className="grid items-end gap-3 md:grid-cols-2">
              <Field label={text("Begintijd", "Start time")}>
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field label={text("Eindtijd", "End time")}>
                <Input
                  type="time"
                  value={draft.details?.endTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("endTime", e.target.value)}
                />
              </Field>
            </div>
          )}
          {(draft.type === "lodging" || draft.type === "car_rental") && (
            <div className="grid items-end gap-3 md:grid-cols-2">
              <Field
                label={
                  draft.type === "lodging"
                    ? text("Inchecktijd", "Check-in time")
                    : text("Ophaaltijd", "Collection time")
                }
              >
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field
                label={
                  draft.type === "lodging"
                    ? text("Uitchecktijd", "Check-out time")
                    : text("Inlevertijd", "Return time")
                }
              >
                <Input
                  type="time"
                  value={draft.details?.endTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("endTime", e.target.value)}
                />
              </Field>
            </div>
          )}
          {draft.type === "car_rental" && (
            <div className="grid items-end gap-3 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-4">
              <Field label={text("Verhuurder", "Rental company")}>
                <Input
                  value={draft.provider ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. Sixt"
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, provider: e.target.value }))
                  }
                />
              </Field>
              <Field label={text("Auto", "Vehicle")}>
                <Input
                  value={draft.details?.vehicle ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. Peugeot 208"
                  onChange={(e) => detail("vehicle", e.target.value)}
                />
              </Field>
              <Field label={text("Categorie", "Category")}>
                <Input
                  value={draft.details?.vehicleCategory ?? ""}
                  disabled={!editable}
                  placeholder="Compact"
                  onChange={(e) => detail("vehicleCategory", e.target.value)}
                />
              </Field>
              <Field label={text("Borg", "Deposit")}>
                <Input
                  type="number"
                  min="0"
                  value={draft.details?.deposit ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("deposit", Number(e.target.value))}
                />
              </Field>
              <Field label={text("Verzekering", "Insurance")}>
                <Input
                  value={draft.details?.insurance ?? ""}
                  disabled={!editable}
                  placeholder={text("Bijv. all-risk", "For example, comprehensive")}
                  onChange={(e) => detail("insurance", e.target.value)}
                />
              </Field>
              <Field label={text("Eigen risico", "Excess")}>
                <Input
                  type="number"
                  min="0"
                  value={draft.details?.excess ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("excess", Number(e.target.value))}
                />
              </Field>
            </div>
          )}
          {draft.type === "transport" && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/25 p-3">
              <Field label={text("Vervoerssoort", "Mode of transport")}>
                <select
                  className="form-control"
                  value={draft.details?.transportMode ?? ""}
                  disabled={!editable}
                  onChange={(event) => {
                    const transportMode = (event.target.value || undefined) as
                      TransportMode | undefined;
                    setDraft((current) => {
                      const details = { ...current.details, transportMode };
                      if (!transportModeUsesOwnFuel(transportMode)) {
                        delete details.distanceKm;
                        delete details.consumptionPer100Km;
                        delete details.fuelPricePerLiter;
                        delete details.fuelCurrency;
                      }
                      return { ...current, details };
                    });
                  }}
                >
                  <option value="">{text("Kies vervoerssoort", "Choose transport mode")}</option>
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {text(mode.nl, mode.en)}
                    </option>
                  ))}
                </select>
              </Field>
              {transportUsesFuel ? (
                <div className="grid items-end gap-3 md:grid-cols-4">
                  <Field label={text("Afstand (km)", "Distance (km)")}>
                    <Input
                      type="number"
                      min="0"
                      value={draft.details?.distanceKm ?? ""}
                      disabled={!editable}
                      onChange={(e) => detail("distanceKm", Number(e.target.value))}
                    />
                  </Field>
                  <Field label={text("Verbruik (L/100 km)", "Consumption (L/100 km)")}>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={draft.details?.consumptionPer100Km ?? ""}
                      disabled={!editable}
                      onChange={(e) => detail("consumptionPer100Km", Number(e.target.value))}
                    />
                  </Field>
                  <Field label={text("Brandstofprijs / L", "Fuel price / L")}>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.details?.fuelPricePerLiter ?? ""}
                      disabled={!editable}
                      onChange={(e) => detail("fuelPricePerLiter", Number(e.target.value))}
                    />
                  </Field>
                  <Field label={text("Brandstofvaluta", "Fuel currency")}>
                    <select
                      className="form-control"
                      value={draft.details?.fuelCurrency ?? draft.currency ?? "EUR"}
                      disabled={!editable}
                      onChange={(e) => detail("fuelCurrency", e.target.value)}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : (
                draft.details?.transportMode && (
                  <p className="text-xs text-muted-foreground">
                    {text(
                      "Voor deze vervoerssoort wordt geen eigen brandstofprognose berekend.",
                      "No personal fuel estimate is calculated for this mode of transport.",
                    )}
                  </p>
                )
              )}
              {transportUsesFuel && fuelEstimate.cost > 0 && (
                <p className="text-sm text-muted-foreground">
                  {text("Schatting", "Estimate")}: {fuelEstimate.liters.toFixed(1)}{" "}
                  {text("liter", "litres")} ·{" "}
                  {formatMoney(
                    fuelEstimate.cost,
                    draft.details?.fuelCurrency ?? draft.currency ?? "EUR",
                  )}
                  .{" "}
                  {text(
                    "Dit telt als prognose, niet als werkelijke uitgave.",
                    "This is a forecast and does not count as an actual expense.",
                  )}
                </p>
              )}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {typeIsMoving ? (
              <>
                <LocationPicker
                  label={
                    draft.type === "car_rental"
                      ? text("Ophaallocatie", "Collection location")
                      : text("Vertreklocatie", "Departure location")
                  }
                  value={departure}
                  onPick={setDeparture}
                  disabled={!editable}
                />
                <LocationPicker
                  label={
                    draft.type === "car_rental"
                      ? text("Inleverlocatie", "Return location")
                      : text("Aankomstlocatie", "Arrival location")
                  }
                  value={arrival}
                  onPick={setArrival}
                  disabled={!editable}
                />
              </>
            ) : (
              <LocationPicker
                label={text("Locatie", "Location")}
                value={location}
                onPick={setLocation}
                disabled={!editable}
              />
            )}
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {text(
              "Geselecteerde locaties worden automatisch met de routekaart gesynchroniseerd.",
              "Selected locations are automatically synchronised with the route map.",
            )}
          </p>
          <div className="grid items-end gap-3 md:grid-cols-5">
            {draft.type !== "car_rental" && (
              <Field label={text("Aanbieder", "Provider")}>
                <Input
                  value={draft.provider ?? ""}
                  disabled={!editable}
                  placeholder={text("Optioneel", "Optional")}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, provider: e.target.value }))
                  }
                />
              </Field>
            )}
            <Field label={text("Boekingsnummer", "Booking reference")}>
              <Input
                value={draft.bookingReference ?? ""}
                disabled={!editable}
                placeholder={text("Optioneel", "Optional")}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, bookingReference: e.target.value }))
                }
              />
            </Field>
            <Field label={text("Prijs", "Price")}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                disabled={!editable}
                placeholder={text("Optioneel", "Optional")}
                onChange={(e) => setDraft((current) => ({ ...current, amount: e.target.value }))}
              />
            </Field>
            <Field label={text("Valuta", "Currency")}>
              <select
                className="form-control"
                value={draft.currency}
                disabled={!editable}
                onChange={(e) => setDraft((current) => ({ ...current, currency: e.target.value }))}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={text("Betaald door", "Paid by")}>
              <select
                className="form-control min-w-0 w-full max-w-full truncate"
                value={paidBy}
                disabled={!editable}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {payers.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={text("Notities / omschrijving", "Notes / description")}>
            <Input
              value={draft.notes ?? ""}
              disabled={!editable}
              placeholder={text("Optioneel", "Optional")}
              onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))}
            />
          </Field>
          <label className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-muted/25 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={draft.details?.sharePublicly ?? false}
              disabled={!editable}
              onChange={(event) => detail("sharePublicly", event.target.checked)}
            />
            <span>
              <span className="flex items-center gap-1.5 font-medium">
                <Globe2 className="size-4 text-primary" />
                {text("Delen op de openbare reispagina", "Share on the public trip page")}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {text(
                  "Alleen type, titel, datum, tijd en openbare locaties worden gedeeld. Boekingsnummer, prijs, betaler, notities en live vluchtgegevens blijven privé.",
                  "Only the type, title, date, time and public locations are shared. Booking reference, price, payer, notes and live flight data remain private.",
                )}
              </span>
            </span>
          </label>
          <Button
            className="mt-2"
            disabled={!editable || saving || loadingFlight}
            onClick={() => void save()}
          >
            {editingId ? (
              saving ? (
                text("Opslaan…", "Saving…")
              ) : (
                text("Wijzigingen opslaan", "Save changes")
              )
            ) : (
              <>
                <Plus className="size-4" />{" "}
                {saving ? text("Opslaan…", "Saving…") : text("Onderdeel opslaan", "Save item")}
              </>
            )}
          </Button>
        </fieldset>
      </CardContent>
    </Card>
  );
  return (
    <div className="space-y-4">
      {editingId ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !saving && !loadingFlight) reset();
          }}
        >
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{text("Reisonderdeel wijzigen", "Edit travel item")}</DialogTitle>
              <DialogDescription>
                {text(
                  "Pas de boeking aan en sla je wijzigingen op.",
                  "Update the booking and save your changes.",
                )}
              </DialogDescription>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>
      ) : (
        !initialItem && form
      )}
      {!initialItem && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{text("Geboekte onderdelen", "Booked items")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(trip.travelItems ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                {text(
                  "Nog geen vluchten, overnachtingen of andere boekingen.",
                  "No flights, accommodation or other bookings yet.",
                )}
              </p>
            )}
            {(trip.travelItems ?? []).map((item) => {
              const itemType = TYPES.find((type) => type.id === item.type);
              const transportMode = TRANSPORT_MODES.find(
                (mode) => mode.id === item.details?.transportMode,
              );
              const ItemIcon = itemType?.icon ?? Ticket;
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <ItemIcon className="size-4 shrink-0" /> {item.title}{" "}
                      <Badge variant="secondary">
                        {itemType ? travelTypeLabel(itemType.id, itemType.label, text) : ""}
                      </Badge>
                      {item.details?.sharePublicly && (
                        <Badge variant="outline" className="gap-1">
                          <Globe2 className="size-3" /> {text("Openbaar", "Public")}
                        </Badge>
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {item.date}
                      {item.endDate ? ` ${text("t/m", "to")} ${item.endDate}` : ""}
                      {item.bookingReference
                        ? ` · ${text("Boeking", "Booking")}: ${item.bookingReference}`
                        : ""}
                      {item.amount ? ` · ${formatMoney(item.amount, item.currency ?? "EUR")}` : ""}
                    </p>
                    {item.flightStatus && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {text("Vluchtstatus", "Flight status")}: {item.flightStatus}
                      </p>
                    )}
                    {item.type === "transport" && transportMode && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {text("Vervoerssoort", "Mode of transport")}:{" "}
                        {text(transportMode.nl, transportMode.en)}
                      </p>
                    )}
                    {item.type === "flight" &&
                      (item.details?.flightDepartureAirport ||
                        item.details?.flightArrivalAirport) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.details.flightDepartureAirport ||
                            text("Vertrek onbekend", "Departure unknown")}{" "}
                          →{" "}
                          {item.details.flightArrivalAirport ||
                            text("Aankomst onbekend", "Arrival unknown")}
                          {item.details.flightDepartureGate
                            ? ` · Gate ${item.details.flightDepartureGate}`
                            : ""}
                        </p>
                      )}
                  </div>
                  {editable && (
                    <div className="flex shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={text("Boeking wijzigen", "Edit booking")}
                        disabled={saving}
                        onClick={() => edit(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={text("Boeking verwijderen", "Delete booking")}
                        disabled={saving}
                        onClick={() => void remove(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FlightStatusSummary({ flight }: { flight: FlightLookup }) {
  const { text } = useLocale();
  const departure = [
    flight.departure?.actual && `${text("Werkelijk", "Actual")} ${flight.departure.actual}`,
    !flight.departure?.actual &&
      flight.departure?.scheduled &&
      `${text("Gepland", "Scheduled")} ${flight.departure.scheduled}`,
    flight.departure?.terminal && `Terminal ${flight.departure.terminal}`,
    flight.departure?.gate && `Gate ${flight.departure.gate}`,
  ].filter(Boolean);
  const arrival = [
    flight.arrival?.estimated && `${text("Verwacht", "Estimated")} ${flight.arrival.estimated}`,
    !flight.arrival?.estimated &&
      flight.arrival?.scheduled &&
      `${text("Gepland", "Scheduled")} ${flight.arrival.scheduled}`,
    flight.arrival?.terminal && `Terminal ${flight.arrival.terminal}`,
    flight.arrival?.gate && `Gate ${flight.arrival.gate}`,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 text-sm md:col-span-3">
      <p className="font-medium">
        {flight.airline || "Vlucht"} · {flight.flightNumber}
        {flight.status ? ` · ${flight.status}` : ""}
      </p>
      <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">{text("Vertrek", "Departure")}:</span>{" "}
          {flight.departure?.airportFull ||
            flight.departure?.airport ||
            text("Onbekend", "Unknown")}
          {departure.length ? ` · ${departure.join(" · ")}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">{text("Aankomst", "Arrival")}:</span>{" "}
          {flight.arrival?.airportFull || flight.arrival?.airport || text("Onbekend", "Unknown")}
          {arrival.length ? ` · ${arrival.join(" · ")}` : ""}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-0 space-y-1 text-xs text-muted-foreground [&_input]:min-w-0 [&_input]:max-w-full">
      <span>{label}</span>
      {children}
    </label>
  );
}
function LocationPicker({
  label,
  value,
  onPick,
  disabled,
}: {
  label: string;
  value: GeoResult | undefined;
  onPick: (location: GeoResult | undefined) => void;
  disabled: boolean;
}) {
  const { locale, text } = useLocale();
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {value.name}, {localizeCountry(value.country, locale)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={`${label} ${text("wijzigen", "edit")}`}
            onClick={() => onPick(undefined)}
          >
            {text("Wijzigen", "Edit")}
          </Button>
        </div>
      ) : (
        <PlaceSearch onPick={onPick} disabled={disabled} />
      )}
    </div>
  );
}
