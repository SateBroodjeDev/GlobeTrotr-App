import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Car,
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
import type { TravelItem, TravelItemType, Trip } from "@/lib/types";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TYPES: { id: TravelItemType; label: string; icon: typeof Plane }[] = [
  { id: "flight", label: "Vlucht", icon: Plane },
  { id: "lodging", label: "Overnachting", icon: BedDouble },
  { id: "car_rental", label: "Huurauto", icon: Car },
  { id: "transport", label: "Reis / vervoer", icon: TrainFront },
  { id: "activity", label: "Activiteit", icon: Ticket },
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

export function TripBookings({
  trip,
  editable,
  payers,
  onSave,
  onRemove,
}: {
  trip: Trip;
  editable: boolean;
  payers: string[];
  onSave: (
    item: TravelItem,
    locations: GeoResult[],
    paidBy: string,
    previousId?: string,
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(trip.start));
  const [departure, setDeparture] = useState<GeoResult>();
  const [arrival, setArrival] = useState<GeoResult>();
  const [location, setLocation] = useState<GeoResult>();
  const [flight, setFlight] = useState<FlightLookup>();
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paidBy, setPaidBy] = useState(() => payers[0] ?? "Ik");
  const [editingId, setEditingId] = useState<string>();
  const typeIsMoving = moving(draft.type);
  const Icon = TYPES.find((type) => type.id === draft.type)?.icon ?? Ticket;
  const fuelEstimate = useMemo(() => {
    const d = draft.details;
    const liters = (Number(d?.distanceKm ?? 0) * Number(d?.consumptionPer100Km ?? 0)) / 100;
    return { liters, cost: liters * Number(d?.fuelPricePerLiter ?? 0) };
  }, [draft.details]);
  useEffect(() => {
    if (!payers.includes(paidBy)) setPaidBy(payers[0] ?? "Ik");
  }, [paidBy, payers]);
  const detail = (key: keyof NonNullable<TravelItem["details"]>, value: string | number) =>
    setDraft((current) => ({ ...current, details: { ...current.details, [key]: value } }));
  const reset = (date = trip.start) => {
    setDraft(emptyDraft(date));
    setDeparture(undefined);
    setArrival(undefined);
    setLocation(undefined);
    setFlight(undefined);
    setEditingId(undefined);
    setPaidBy(payers[0] ?? "Ik");
  };
  async function refreshFlight() {
    if (!draft.flightNumber?.trim()) {
      toast.error("Vul eerst een vluchtnummer in, bijvoorbeeld KL1234.");
      return;
    }
    setLoadingFlight(true);
    try {
      const result = await lookupFlight({
        data: { flightNumber: draft.flightNumber, flightDate: draft.date },
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
      toast.success("Live vluchtinformatie bijgewerkt.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vluchtdata kon niet worden opgehaald.");
    } finally {
      setLoadingFlight(false);
    }
  }
  async function save() {
    const title = draft.title.trim();
    if (!title || !draft.date) {
      toast.error("Vul minstens een naam en datum in.");
      return;
    }
    if (draft.type !== "flight" && draft.endDate && draft.endDate < draft.date) {
      toast.error("De einddatum kan niet vóór de startdatum liggen.");
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
      !window.confirm("Dit reisonderdeel verwijderen? Een gekoppelde uitgave wordt ook verwijderd.")
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
      trip.expenses.find((expense) => expense.id === item.expenseId)?.paidBy ?? payers[0] ?? "Ik",
    );
    setFlight(undefined);
  }
  return (
    <div className="space-y-4">
      <Card className="surface">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="size-4" />{" "}
            {editingId ? "Reisonderdeel wijzigen" : "Reisonderdeel toevoegen"}
          </CardTitle>
          {editingId && (
            <Button size="sm" variant="ghost" onClick={() => reset(draft.date)}>
              Annuleren
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid items-end gap-3 md:grid-cols-4">
            <Field label="Type">
              <select
                aria-label="Type reisonderdeel"
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
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={dateLabel(draft.type)}>
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
              <Field label="Vluchtnummer">
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
              <Field label={endDateLabel(draft.type)}>
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
              <Field label="Live vluchtinformatie">
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
                  Live vluchtdata
                </Button>
              </Field>
            ) : (
              <Field
                label={
                  draft.type === "activity"
                    ? "Naam activiteit"
                    : draft.type === "lodging"
                      ? "Hotelnaam"
                      : draft.type === "car_rental"
                        ? "Huurauto / reservering"
                        : "Naam / verbinding"
                }
              >
                <Input
                  value={draft.title}
                  disabled={!editable}
                  placeholder="Naam"
                  onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                />
              </Field>
            )}
          </div>
          {draft.type === "flight" && (
            <div className="grid items-end gap-3 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-3">
              <Field label="Titel">
                <Input
                  value={draft.title}
                  disabled={!editable}
                  placeholder="Wordt automatisch ingevuld"
                  onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                />
              </Field>
              <Field label="Vertrektijd">
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field label="Aankomsttijd">
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
              <Field label="Begintijd">
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field label="Eindtijd">
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
              <Field label={draft.type === "lodging" ? "Inchecktijd" : "Ophaaltijd"}>
                <Input
                  type="time"
                  value={draft.details?.startTime ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("startTime", e.target.value)}
                />
              </Field>
              <Field label={draft.type === "lodging" ? "Uitchecktijd" : "Inlevertijd"}>
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
              <Field label="Verhuurder">
                <Input
                  value={draft.provider ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. Sixt"
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, provider: e.target.value }))
                  }
                />
              </Field>
              <Field label="Auto">
                <Input
                  value={draft.details?.vehicle ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. Peugeot 208"
                  onChange={(e) => detail("vehicle", e.target.value)}
                />
              </Field>
              <Field label="Categorie">
                <Input
                  value={draft.details?.vehicleCategory ?? ""}
                  disabled={!editable}
                  placeholder="Compact"
                  onChange={(e) => detail("vehicleCategory", e.target.value)}
                />
              </Field>
              <Field label="Borg">
                <Input
                  type="number"
                  min="0"
                  value={draft.details?.deposit ?? ""}
                  disabled={!editable}
                  onChange={(e) => detail("deposit", Number(e.target.value))}
                />
              </Field>
              <Field label="Verzekering">
                <Input
                  value={draft.details?.insurance ?? ""}
                  disabled={!editable}
                  placeholder="Bijv. all-risk"
                  onChange={(e) => detail("insurance", e.target.value)}
                />
              </Field>
              <Field label="Eigen risico">
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
              <div className="grid items-end gap-3 md:grid-cols-4">
                <Field label="Afstand (km)">
                  <Input
                    type="number"
                    min="0"
                    value={draft.details?.distanceKm ?? ""}
                    disabled={!editable}
                    onChange={(e) => detail("distanceKm", Number(e.target.value))}
                  />
                </Field>
                <Field label="Verbruik (L/100 km)">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={draft.details?.consumptionPer100Km ?? ""}
                    disabled={!editable}
                    onChange={(e) => detail("consumptionPer100Km", Number(e.target.value))}
                  />
                </Field>
                <Field label="Brandstofprijs / L">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.details?.fuelPricePerLiter ?? ""}
                    disabled={!editable}
                    onChange={(e) => detail("fuelPricePerLiter", Number(e.target.value))}
                  />
                </Field>
                <Field label="Brandstofvaluta">
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
              {fuelEstimate.cost > 0 && (
                <p className="text-sm text-muted-foreground">
                  Schatting: {fuelEstimate.liters.toFixed(1)} liter ·{" "}
                  {formatMoney(
                    fuelEstimate.cost,
                    draft.details?.fuelCurrency ?? draft.currency ?? "EUR",
                  )}
                  . Dit telt als prognose, niet als werkelijke uitgave.
                </p>
              )}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {typeIsMoving ? (
              <>
                <LocationPicker
                  label={draft.type === "car_rental" ? "Ophaallocatie" : "Vertreklocatie"}
                  value={departure}
                  onPick={setDeparture}
                  disabled={!editable}
                />
                <LocationPicker
                  label={draft.type === "car_rental" ? "Inleverlocatie" : "Aankomstlocatie"}
                  value={arrival}
                  onPick={setArrival}
                  disabled={!editable}
                />
              </>
            ) : (
              <LocationPicker
                label="Locatie"
                value={location}
                onPick={setLocation}
                disabled={!editable}
              />
            )}
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Geselecteerde locaties worden automatisch met de routekaart gesynchroniseerd.
          </p>
          <div className="grid items-end gap-3 md:grid-cols-5">
            {draft.type !== "car_rental" && (
              <Field label="Aanbieder">
                <Input
                  value={draft.provider ?? ""}
                  disabled={!editable}
                  placeholder="Optioneel"
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, provider: e.target.value }))
                  }
                />
              </Field>
            )}
            <Field label="Boekingsnummer">
              <Input
                value={draft.bookingReference ?? ""}
                disabled={!editable}
                placeholder="Optioneel"
                onChange={(e) =>
                  setDraft((current) => ({ ...current, bookingReference: e.target.value }))
                }
              />
            </Field>
            <Field label="Prijs">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                disabled={!editable}
                placeholder="Optioneel"
                onChange={(e) => setDraft((current) => ({ ...current, amount: e.target.value }))}
              />
            </Field>
            <Field label="Valuta">
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
            <Field label="Betaald door">
              <select
                className="form-control"
                value={paidBy}
                disabled={!editable}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {payers.map((payer) => (
                  <option key={payer} value={payer}>
                    {payer}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notities / omschrijving">
            <Input
              value={draft.notes ?? ""}
              disabled={!editable}
              placeholder="Optioneel"
              onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))}
            />
          </Field>
          <Button disabled={!editable || saving} onClick={() => void save()}>
            {editingId ? (
              saving ? (
                "Opslaan…"
              ) : (
                "Wijzigingen opslaan"
              )
            ) : (
              <>
                <Plus className="size-4" /> {saving ? "Opslaan…" : "Onderdeel opslaan"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Geboekte onderdelen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(trip.travelItems ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nog geen vluchten, overnachtingen of andere boekingen.
            </p>
          )}
          {(trip.travelItems ?? []).map((item) => {
            const itemType = TYPES.find((type) => type.id === item.type);
            const ItemIcon = itemType?.icon ?? Ticket;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <ItemIcon className="size-4 shrink-0" /> {item.title}{" "}
                    <Badge variant="secondary">{itemType?.label}</Badge>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {item.date}
                    {item.endDate ? ` t/m ${item.endDate}` : ""}
                    {item.bookingReference ? ` · Boeking: ${item.bookingReference}` : ""}
                    {item.amount ? ` · ${formatMoney(item.amount, item.currency ?? "EUR")}` : ""}
                  </p>
                  {item.flightStatus && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vluchtstatus: {item.flightStatus}
                    </p>
                  )}
                  {item.type === "flight" &&
                    (item.details?.flightDepartureAirport ||
                      item.details?.flightArrivalAirport) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.details.flightDepartureAirport || "Vertrek onbekend"} →{" "}
                        {item.details.flightArrivalAirport || "Aankomst onbekend"}
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
                      aria-label="Boeking wijzigen"
                      disabled={saving}
                      onClick={() => edit(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Boeking verwijderen"
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
    </div>
  );
}

function FlightStatusSummary({ flight }: { flight: FlightLookup }) {
  const departure = [
    flight.departure?.actual && `Werkelijk ${flight.departure.actual}`,
    !flight.departure?.actual &&
      flight.departure?.scheduled &&
      `Gepland ${flight.departure.scheduled}`,
    flight.departure?.terminal && `Terminal ${flight.departure.terminal}`,
    flight.departure?.gate && `Gate ${flight.departure.gate}`,
  ].filter(Boolean);
  const arrival = [
    flight.arrival?.estimated && `Verwacht ${flight.arrival.estimated}`,
    !flight.arrival?.estimated &&
      flight.arrival?.scheduled &&
      `Gepland ${flight.arrival.scheduled}`,
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
          <span className="font-medium text-foreground">Vertrek:</span>{" "}
          {flight.departure?.airportFull || flight.departure?.airport || "Onbekend"}
          {departure.length ? ` · ${departure.join(" · ")}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">Aankomst:</span>{" "}
          {flight.arrival?.airportFull || flight.arrival?.airport || "Onbekend"}
          {arrival.length ? ` · ${arrival.join(" · ")}` : ""}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
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
  value?: GeoResult;
  onPick: (location: GeoResult) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
          <MapPin className="size-4" /> {value.name}, {value.country}
        </div>
      ) : (
        <PlaceSearch onPick={onPick} disabled={disabled} />
      )}
    </div>
  );
}
