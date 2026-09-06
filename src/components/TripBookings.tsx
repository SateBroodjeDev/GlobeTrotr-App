import { useState } from "react";
import {
  BedDouble,
  Loader2,
  MapPin,
  Plane,
  Plus,
  RefreshCw,
  Ticket,
  TrainFront,
} from "lucide-react";
import { lookupFlight, type FlightLookup } from "@/lib/flight.functions";
import { CURRENCIES } from "@/lib/services";
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
  { id: "transport", label: "Reis / vervoer", icon: TrainFront },
  { id: "activity", label: "Activiteit", icon: Ticket },
];

type Draft = Omit<TravelItem, "id" | "departure" | "arrival" | "location" | "amount"> & {
  amount: string;
};

function emptyDraft(date: string): Draft {
  return { type: "flight", title: "", date, amount: "", currency: "EUR" };
}

export function TripBookings({
  trip,
  editable,
  onAdd,
  onRemove,
}: {
  trip: Trip;
  editable: boolean;
  onAdd: (item: TravelItem, locations: GeoResult[]) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(trip.start));
  const [departure, setDeparture] = useState<GeoResult>();
  const [arrival, setArrival] = useState<GeoResult>();
  const [location, setLocation] = useState<GeoResult>();
  const [flight, setFlight] = useState<FlightLookup>();
  const [loadingFlight, setLoadingFlight] = useState(false);

  const moving = draft.type === "flight" || draft.type === "transport";
  const Icon = TYPES.find((type) => type.id === draft.type)?.icon ?? Ticket;

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
      }));
      toast.success("Live vluchtinformatie bijgewerkt.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vluchtdata kon niet worden opgehaald.");
    } finally {
      setLoadingFlight(false);
    }
  }

  function add() {
    if (!draft.title.trim() || !draft.date) {
      toast.error("Vul minstens een naam en datum in.");
      return;
    }
    const selectedLocations = moving
      ? [departure, arrival].filter((value): value is GeoResult => Boolean(value))
      : [location].filter((value): value is GeoResult => Boolean(value));
    const amount = Number(draft.amount);
    onAdd(
      {
        ...draft,
        id: crypto.randomUUID(),
        amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
        departure: moving && departure ? departure : undefined,
        arrival: moving && arrival ? arrival : undefined,
        location: !moving && location ? location : undefined,
      },
      selectedLocations,
    );
    setDraft(emptyDraft(draft.date));
    setDeparture(undefined);
    setArrival(undefined);
    setLocation(undefined);
    setFlight(undefined);
  }

  return (
    <div className="space-y-4">
      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="size-4" /> Reisonderdeel toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <select
              aria-label="Type reisonderdeel"
              className="rounded-lg border border-input bg-card px-3 text-sm"
              value={draft.type}
              disabled={!editable}
              onChange={(event) => {
                const type = event.target.value as TravelItemType;
                setDraft((current) => ({ ...current, type }));
                setFlight(undefined);
              }}
            >
              {TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={draft.date}
              min={trip.start || undefined}
              disabled={!editable}
              onChange={(event) =>
                setDraft((current) => ({ ...current, date: event.target.value }))
              }
            />
            <Input
              type="date"
              value={draft.endDate ?? ""}
              min={draft.date || undefined}
              disabled={!editable}
              onChange={(event) =>
                setDraft((current) => ({ ...current, endDate: event.target.value || undefined }))
              }
              placeholder="Einddatum (optioneel)"
            />
            <Input
              value={draft.title}
              disabled={!editable}
              placeholder="Naam, hotel of verbinding"
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>

          {draft.type === "flight" && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={draft.flightNumber ?? ""}
                  disabled={!editable}
                  placeholder="Vluchtnummer, bijv. KL1234"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, flightNumber: event.target.value }))
                  }
                />
                <Button
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
              </div>
              {flight && (
                <p className="text-sm text-muted-foreground">
                  {flight.airline || "Vlucht"} ·{" "}
                  {flight.departure?.airport || flight.departure?.iata || "vertrek onbekend"} →{" "}
                  {flight.arrival?.airport || flight.arrival?.iata || "aankomst onbekend"}
                  {flight.status ? ` · ${flight.status}` : ""}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {moving ? (
              <>
                <LocationPicker
                  label="Vertreklocatie"
                  value={departure}
                  onPick={setDeparture}
                  disabled={!editable}
                />
                <LocationPicker
                  label="Aankomstlocatie"
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
            Gekozen locaties worden automatisch als stop op de routekaart gezet.
          </p>

          <div className="grid gap-2 md:grid-cols-5">
            <Input
              className="md:col-span-2"
              value={draft.provider ?? ""}
              disabled={!editable}
              placeholder="Aanbieder (optioneel)"
              onChange={(event) =>
                setDraft((current) => ({ ...current, provider: event.target.value }))
              }
            />
            <Input
              value={draft.bookingReference ?? ""}
              disabled={!editable}
              placeholder="Boekingsnummer"
              onChange={(event) =>
                setDraft((current) => ({ ...current, bookingReference: event.target.value }))
              }
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.amount}
              disabled={!editable}
              placeholder="Kosten"
              onChange={(event) =>
                setDraft((current) => ({ ...current, amount: event.target.value }))
              }
            />
            <select
              aria-label="Valuta"
              className="rounded-lg border border-input bg-card px-3 text-sm"
              value={draft.currency}
              disabled={!editable}
              onChange={(event) =>
                setDraft((current) => ({ ...current, currency: event.target.value }))
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
          <Input
            value={draft.notes ?? ""}
            disabled={!editable}
            placeholder="Notities (optioneel)"
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          />
          <Button disabled={!editable} onClick={add}>
            <Plus className="size-4" /> Onderdeel en kosten opslaan
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
                    {item.amount ? ` · ${item.amount.toFixed(2)} ${item.currency}` : ""}
                  </p>
                  {item.flightStatus && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vluchtstatus: {item.flightStatus}
                    </p>
                  )}
                </div>
                {editable && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
                    Verwijder
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
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
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <MapPin className="size-4" /> {value.name}, {value.country}
        </div>
      ) : (
        <PlaceSearch onPick={onPick} disabled={disabled} />
      )}
    </div>
  );
}
