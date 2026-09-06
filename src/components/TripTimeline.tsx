import { useMemo, useState } from "react";
import {
  BedDouble,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plane,
  Plus,
  Ticket,
  TrainFront,
  Trash2,
} from "lucide-react";
import type { ItineraryItem, TravelItem, Trip } from "@/lib/types";
import { formatMoney } from "@/lib/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TimelineEntry = {
  id: string;
  day: string;
  title: string;
  subtitle?: string;
  kind: "manual" | TravelItem["type"];
  time?: string;
  item?: TravelItem;
  manual?: ItineraryItem;
  phase?: "start" | "ongoing" | "end";
};

const icons = {
  manual: Ticket,
  flight: Plane,
  lodging: BedDouble,
  transport: TrainFront,
  car_rental: Car,
  activity: Ticket,
} as const;

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const out: string[] = [];
  for (let current = start; current <= end && out.length < 370; current = addDays(current, 1)) {
    out.push(current);
  }
  return out;
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function bookingEntries(item: TravelItem): TimelineEntry[] {
  const end = item.endDate && item.endDate >= item.date ? item.endDate : item.date;
  const multiDay = (item.type === "lodging" || item.type === "car_rental") && end > item.date;
  if (!multiDay) {
    return [
      {
        id: item.id,
        day: item.date,
        title: item.title,
        kind: item.type,
        item,
        time: item.details?.startTime,
      },
    ];
  }
  const dates = daysBetween(item.date, end);
  return dates.map((day, index) => {
    const isStart = index === 0;
    const isEnd = index === dates.length - 1;
    const lodging = item.type === "lodging";
    return {
      id: `${item.id}:${day}`,
      day,
      kind: item.type,
      item,
      phase: isStart ? "start" : isEnd ? "end" : "ongoing",
      title: isStart
        ? `${lodging ? "Inchecken" : "Huurauto ophalen"} · ${item.title}`
        : isEnd
          ? `${lodging ? "Uitchecken" : "Huurauto inleveren"} · ${item.title}`
          : `${lodging ? "Overnachting" : "Huurauto beschikbaar"} · ${item.title}`,
      subtitle: isStart || isEnd ? undefined : `Dag ${index + 1} van ${dates.length}`,
      time: isStart ? item.details?.startTime : isEnd ? item.details?.endTime : undefined,
    };
  });
}

function detailFor(item: TravelItem) {
  const location =
    item.departure && item.arrival
      ? `${item.departure.name} → ${item.arrival.name}`
      : item.location?.name;
  const values = [
    location,
    item.provider,
    item.bookingReference ? `Boeking ${item.bookingReference}` : undefined,
    item.flightStatus,
  ].filter(Boolean);
  return values.join(" · ");
}

export function TripTimeline({
  trip,
  baseCurrency,
  editable,
  onAdd,
  onRemove,
}: {
  trip: Trip;
  baseCurrency: string;
  editable: boolean;
  onAdd: (item: Omit<ItineraryItem, "id">) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  // A long trip stays usable by opening one day at a time. The complete
  // itinerary remains one click away for overview and printing.
  const [mode, setMode] = useState<"all" | "day">("day");
  const [selectedDay, setSelectedDay] = useState(trip.start);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const entries = useMemo(() => {
    const bookingIds = new Set((trip.travelItems ?? []).map((item) => item.id));
    const manual = trip.itinerary
      .filter((item) => !item.sourceTravelItemId || !bookingIds.has(item.sourceTravelItemId))
      // Older booking rows had no reference. They can be identified safely by exact date and title.
      .filter(
        (item) =>
          !(trip.travelItems ?? []).some(
            (booking) => booking.date === item.day && booking.title === item.title,
          ),
      )
      .map<TimelineEntry>((item) => ({
        id: item.id,
        day: item.day,
        title: item.title,
        subtitle: item.notes,
        kind: "manual",
        manual: item,
      }));
    return [...manual, ...(trip.travelItems ?? []).flatMap(bookingEntries)].sort((a, b) => {
      const byDay = a.day.localeCompare(b.day);
      return byDay || (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
    });
  }, [trip.itinerary, trip.travelItems]);
  const dates = useMemo(
    () => Array.from(new Set([trip.start, trip.end, ...entries.map((entry) => entry.day)])).sort(),
    [entries, trip.end, trip.start],
  );
  const visible = mode === "day" ? entries.filter((entry) => entry.day === selectedDay) : entries;

  function moveDay(direction: number) {
    const current = dates.indexOf(selectedDay);
    setSelectedDay(
      dates[Math.max(0, Math.min(dates.length - 1, current + direction))] ?? selectedDay,
    );
  }

  async function addManualItem() {
    if (!title.trim() || !selectedDay) return;
    setSaving(true);
    try {
      await onAdd({ day: selectedDay, title: title.trim() });
      setTitle("");
    } catch {
      // The parent displays the server error and restores the previous state.
    } finally {
      setSaving(false);
    }
  }

  async function removeManualItem(id: string) {
    if (!window.confirm("Dit programma-item verwijderen?")) return;
    setSaving(true);
    try {
      await onRemove(id);
    } catch {
      // The parent displays the server error and restores the previous state.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="surface">
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm">Dagplanning</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={mode === "all" ? "default" : "outline"}
            onClick={() => setMode("all")}
          >
            Hele reis
          </Button>
          <Button
            size="sm"
            variant={mode === "day" ? "default" : "outline"}
            onClick={() => setMode("day")}
          >
            Per dag
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "day" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/35 p-2">
            <Button size="icon" variant="ghost" aria-label="Vorige dag" onClick={() => moveDay(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              aria-label="Kies een dag"
              type="date"
              value={selectedDay}
              min={trip.start}
              max={trip.end}
              className="w-auto"
              onChange={(event) => setSelectedDay(event.target.value)}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Volgende dag"
              onClick={() => moveDay(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {editable && (
          <div className="grid items-end gap-2 rounded-xl border border-border p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
            <label className="space-y-1 text-xs text-muted-foreground">
              Datum
              <Input
                type="date"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Eigen programma-item
              <Input
                value={title}
                placeholder="Bijvoorbeeld: Diner reserveren"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <Button
              disabled={saving}
              onClick={() => {
                void addManualItem();
              }}
            >
              <Plus className="size-4" /> {saving ? "Opslaan…" : "Toevoegen"}
            </Button>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nog geen onderdelen voor deze dag.</p>
        ) : (
          <div className="space-y-6">
            {dates
              .filter((day) => mode === "all" || day === selectedDay)
              .map((day) => {
                const dayEntries = visible.filter((entry) => entry.day === day);
                if (!dayEntries.length && mode === "all") return null;
                return (
                  <section key={day} className="space-y-3">
                    <h3 className="font-display text-base font-semibold capitalize">
                      {dateLabel(day)}
                    </h3>
                    <div className="relative space-y-3 border-l border-border pl-5 before:absolute before:-left-1 before:top-1 before:size-2 before:rounded-full before:bg-primary">
                      {dayEntries.map((entry) => {
                        const Icon = icons[entry.kind];
                        const amount = entry.item?.amount;
                        return (
                          <article
                            key={entry.id}
                            className="relative rounded-xl border border-border bg-card p-3 shadow-sm"
                          >
                            <span className="absolute -left-[1.9rem] top-4 grid size-6 place-items-center rounded-full border border-border bg-background text-primary">
                              <Icon className="size-3.5" />
                            </span>
                            <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{entry.title}</p>
                                {(entry.subtitle || entry.item) && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {entry.subtitle || detailFor(entry.item!)}
                                  </p>
                                )}
                              </div>
                              {entry.time && (
                                <Badge variant="outline">
                                  <Clock3 className="size-3" /> {entry.time}
                                </Badge>
                              )}
                              {amount ? (
                                <Badge variant="secondary">
                                  {formatMoney(amount, entry.item?.currency ?? baseCurrency)}
                                </Badge>
                              ) : null}
                              {entry.manual && editable && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Verwijder programma-item"
                                  disabled={saving}
                                  onClick={() => void removeManualItem(entry.manual!.id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                            {entry.item?.location && (
                              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" /> {entry.item.location.name}
                              </p>
                            )}
                            {entry.item?.notes && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {entry.item.notes}
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
          </div>
        )}
        {entries.some((entry) => entry.item?.amount) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleDollarSign className="size-3" /> Kosten zijn gekoppeld aan het reisonderdeel en
            staan ook bij Uitgaven.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
