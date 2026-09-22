import { useMemo, useState, type ReactNode } from "react";
import { Archive, Check, ExternalLink, GitCompareArrows, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, convert, formatMoney, type Rates } from "@/lib/services";
import {
  convertOptionToBooking,
  MAX_COMPARE_OPTIONS,
  normalizeTravelOption,
} from "@/lib/trip-options";
import type { Trip, TravelItemType, TravelOption } from "@/lib/types";
import { uid } from "@/lib/workspace";

type Text = (nl: string, en: string) => string;
type Draft = {
  title: string;
  type: TravelItemType;
  startDate: string;
  endDate: string;
  provider: string;
  amount: string;
  currency: string;
  chargesIncluded: boolean;
  cancellation: string;
  durationMinutes: string;
  distanceKm: string;
  sourceUrl: string;
  notes: string;
};

const emptyDraft = (date: string): Draft => ({
  title: "",
  type: "lodging",
  startDate: date,
  endDate: "",
  provider: "",
  amount: "",
  currency: "EUR",
  chargesIncluded: false,
  cancellation: "",
  durationMinutes: "",
  distanceKm: "",
  sourceUrl: "",
  notes: "",
});

export function TripOptions({
  trip,
  editable,
  base,
  rates,
  save,
  text,
}: {
  trip: Trip;
  editable: boolean;
  base: string;
  rates: Rates;
  save: (fn: (current: Trip) => Trip) => Promise<void>;
  text: Text;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(trip.start));
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TravelItemType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TravelOption["status"] | "all">("candidate");
  const [sortBy, setSortBy] = useState<
    "created" | "price" | "duration" | "distance" | "flexibility"
  >("created");
  const options = useMemo(() => trip.travelOptions ?? [], [trip.travelOptions]);
  const visibleOptions = useMemo(() => {
    const filtered = options.filter(
      (option) =>
        (typeFilter === "all" || option.type === typeFilter) &&
        (statusFilter === "all" || option.status === statusFilter),
    );
    return [...filtered].sort((left, right) => {
      if (sortBy === "created") return right.createdAt.localeCompare(left.createdAt);
      if (sortBy === "flexibility") {
        return Number(Boolean(right.cancellation)) - Number(Boolean(left.cancellation));
      }
      const field =
        sortBy === "price" ? "amount" : sortBy === "duration" ? "durationMinutes" : "distanceKm";
      return (left[field] ?? Number.POSITIVE_INFINITY) - (right[field] ?? Number.POSITIVE_INFINITY);
    });
  }, [options, sortBy, statusFilter, typeFilter]);
  const compared = useMemo(
    () => options.filter((item) => selected.includes(item.id)),
    [options, selected],
  );

  async function add() {
    if (!draft.title.trim() || !draft.startDate) {
      toast.error(text("Naam en startdatum zijn verplicht.", "Name and start date are required."));
      return;
    }
    if (draft.endDate && draft.endDate < draft.startDate) {
      toast.error(
        text(
          "De einddatum kan niet vóór de startdatum liggen.",
          "The end date cannot be before the start date.",
        ),
      );
      return;
    }
    if (draft.amount && (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0)) {
      toast.error(text("Vul een geldig bedrag in.", "Enter a valid amount."));
      return;
    }
    setBusy(true);
    try {
      const option = normalizeTravelOption({
        id: uid(),
        type: draft.type,
        title: draft.title,
        startDate: draft.startDate,
        endDate: draft.endDate || undefined,
        provider: draft.provider,
        amount: draft.amount ? Number(draft.amount) : undefined,
        currency: draft.currency,
        chargesIncluded: draft.chargesIncluded,
        cancellation: draft.cancellation,
        durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : undefined,
        distanceKm: draft.distanceKm ? Number(draft.distanceKm) : undefined,
        sourceUrl: draft.sourceUrl,
        notes: draft.notes,
        status: "candidate",
        checkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await save((current) => ({
        ...current,
        travelOptions: [...(current.travelOptions ?? []), option],
      }));
      setDraft(emptyDraft(trip.start));
      setDialogOpen(false);
      toast.success(text("Reisoptie toegevoegd.", "Travel option added."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text("Optie kon niet worden opgeslagen.", "Option could not be saved."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: TravelOption["status"]) {
    if (!editable) return;
    setBusy(true);
    try {
      await save((current) => ({
        ...current,
        travelOptions: (current.travelOptions ?? []).map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      }));
      toast.success(
        status === "rejected"
          ? text("Optie gearchiveerd.", "Option archived.")
          : text("Optie bijgewerkt.", "Option updated."),
      );
    } catch {
      toast.error(text("Optie kon niet worden bijgewerkt.", "Option could not be updated."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !editable ||
      !confirm(text("Deze optie definitief verwijderen?", "Permanently delete this option?"))
    )
      return;
    setBusy(true);
    try {
      await save((current) => ({
        ...current,
        travelOptions: (current.travelOptions ?? []).filter((item) => item.id !== id),
      }));
      setSelected((current) => current.filter((item) => item !== id));
      toast.success(text("Optie verwijderd.", "Option deleted."));
    } catch {
      toast.error(text("Optie kon niet worden verwijderd.", "Option could not be deleted."));
    } finally {
      setBusy(false);
    }
  }

  async function convertToBooking(id: string) {
    if (
      !editable ||
      !confirm(
        text(
          "Deze keuze omzetten naar een geboekt reisonderdeel?",
          "Convert this choice into a booked trip item?",
        ),
      )
    )
      return;
    setBusy(true);
    try {
      let changed = false;
      await save((current) => {
        const result = convertOptionToBooking(
          current.travelOptions ?? [],
          current.travelItems ?? [],
          id,
          uid,
        );
        changed = result.changed;
        return result.changed
          ? { ...current, travelOptions: result.options, travelItems: result.travelItems }
          : current;
      });
      toast.success(
        changed
          ? text("Optie staat nu bij de boekingen.", "Option is now listed under bookings.")
          : text("Deze optie was al omgezet.", "This option was already converted."),
      );
    } catch {
      toast.error(text("Optie kon niet worden omgezet.", "Option could not be converted."));
    } finally {
      setBusy(false);
    }
  }

  function toggleCompare(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < MAX_COMPARE_OPTIONS
          ? [...current, id]
          : current,
    );
    if (!selected.includes(id) && selected.length >= MAX_COMPARE_OPTIONS)
      toast.error(text("Vergelijk maximaal vier opties.", "Compare up to four options."));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <GitCompareArrows className="size-5 text-primary" />
            {text("Reisopties vergelijken", "Compare travel options")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {text(
              "Bewaar kandidaten eerst als optie. Pas je definitieve keuze wordt een boeking.",
              "Save candidates as options first. Only your final choice becomes a booking.",
            )}
          </p>
        </div>
        {editable && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            {text("Optie toevoegen", "Add option")}
          </Button>
        )}
      </div>

      {!!options.length && (
        <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-3">
          <Field label={text("Filter op soort", "Filter by type")}>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TravelItemType | "all")}
            >
              <option value="all">{text("Alle soorten", "All types")}</option>
              {typeEntries(text).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={text("Status", "Status")}>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as TravelOption["status"] | "all")
              }
            >
              <option value="all">{text("Alle statussen", "All statuses")}</option>
              <option value="candidate">{text("Kandidaten", "Candidates")}</option>
              <option value="selected">{text("Gekozen", "Chosen")}</option>
              <option value="rejected">{text("Gearchiveerd", "Archived")}</option>
            </select>
          </Field>
          <Field label={text("Sorteren", "Sort by")}>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="created">{text("Nieuwste", "Newest")}</option>
              <option value="price">{text("Laagste prijs", "Lowest price")}</option>
              <option value="duration">{text("Kortste duur", "Shortest duration")}</option>
              <option value="distance">{text("Kortste afstand", "Shortest distance")}</option>
              <option value="flexibility">
                {text("Annuleringsinformatie", "Cancellation information")}
              </option>
            </select>
          </Field>
        </div>
      )}

      {!options.length ? (
        <Card className="surface">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {text(
              "Nog geen opties. Voeg bijvoorbeeld twee hotels of vluchten toe om ze te vergelijken.",
              "No options yet. Add two hotels or flights to compare them.",
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleOptions.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selected.includes(option.id)}
              disabled={busy}
              editable={editable}
              base={base}
              rates={rates}
              text={text}
              onCompare={() => toggleCompare(option.id)}
              onArchive={() => void setStatus(option.id, "rejected")}
              onDelete={() => void remove(option.id)}
              onConvert={() => void convertToBooking(option.id)}
            />
          ))}
          {!visibleOptions.length && (
            <Card className="surface md:col-span-2 xl:col-span-3">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {text("Geen opties passen bij deze filters.", "No options match these filters.")}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {compared.length >= 2 && (
        <Comparison options={compared} base={base} rates={rates} text={text} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{text("Reisoptie toevoegen", "Add travel option")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={text("Soort", "Type")}>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as TravelItemType })}
              >
                {typeEntries(text).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={text("Naam", "Name")}>
              <Input
                maxLength={160}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label={text("Start", "Start")}>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
            </Field>
            <Field label={text("Einde", "End")}>
              <Input
                type="date"
                min={draft.startDate}
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </Field>
            <Field label={text("Aanbieder", "Provider")}>
              <Input
                maxLength={120}
                value={draft.provider}
                onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Field label={text("Totaalprijs", "Total price")}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                />
              </Field>
              <Field label={text("Valuta", "Currency")}>
                <select
                  className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={text("Duur in minuten", "Duration in minutes")}>
              <Input
                type="number"
                min="1"
                value={draft.durationMinutes}
                onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })}
              />
            </Field>
            <Field label={text("Afstand in km", "Distance in km")}>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={draft.distanceKm}
                onChange={(e) => setDraft({ ...draft, distanceKm: e.target.value })}
              />
            </Field>
            <Field
              label={text("Annuleringsvoorwaarden", "Cancellation terms")}
              className="sm:col-span-2"
            >
              <Input
                maxLength={500}
                value={draft.cancellation}
                onChange={(e) => setDraft({ ...draft, cancellation: e.target.value })}
              />
            </Field>
            <Field label={text("Bronlink", "Source link")} className="sm:col-span-2">
              <Input
                type="url"
                placeholder="https://"
                value={draft.sourceUrl}
                onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
              />
            </Field>
            <Field label={text("Notities", "Notes")} className="sm:col-span-2">
              <Textarea
                rows={4}
                maxLength={2000}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.chargesIncluded}
                onChange={(e) => setDraft({ ...draft, chargesIncluded: e.target.checked })}
              />
              {text(
                "Bekende belastingen en toeslagen zijn inbegrepen",
                "Known taxes and charges are included",
              )}
            </label>
            <Button className="sm:col-span-2" disabled={busy} onClick={() => void add()}>
              {busy ? text("Opslaan…", "Saving…") : text("Optie opslaan", "Save option")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  disabled,
  editable,
  base,
  rates,
  text,
  onCompare,
  onArchive,
  onDelete,
  onConvert,
}: {
  option: TravelOption;
  selected: boolean;
  disabled: boolean;
  editable: boolean;
  base: string;
  rates: Rates;
  text: Text;
  onCompare: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onConvert: () => void;
}) {
  const amount =
    option.amount == null
      ? undefined
      : convert(option.amount, option.currency ?? base, base, rates);
  return (
    <Card className={`surface ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="break-anywhere text-base">{option.title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {typeLabel(option.type, text)} · {option.startDate}
              {option.endDate ? ` → ${option.endDate}` : ""}
            </p>
          </div>
          <Badge variant={option.status === "selected" ? "default" : "outline"}>
            {statusLabel(option.status, text)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label={text("Totaalprijs", "Total price")}
            value={amount == null ? "—" : formatMoney(amount, base)}
          />
          <Metric
            label={text("Toeslagen", "Charges")}
            value={
              option.chargesIncluded ? text("Inbegrepen", "Included") : text("Onbekend", "Unknown")
            }
          />
          <Metric
            label={text("Duur", "Duration")}
            value={option.durationMinutes ? formatDuration(option.durationMinutes) : "—"}
          />
          <Metric
            label={text("Afstand", "Distance")}
            value={option.distanceKm == null ? "—" : `${option.distanceKm} km`}
          />
        </div>
        {option.provider && (
          <p className="break-anywhere text-muted-foreground">
            {text("Aanbieder", "Provider")}: {option.provider}
          </p>
        )}
        {option.cancellation && (
          <p className="break-anywhere text-muted-foreground">
            {text("Annulering", "Cancellation")}: {option.cancellation}
          </p>
        )}
        {option.sourceUrl && (
          <a
            className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
            href={option.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text("Bron openen", "Open source")}
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={onCompare}
          >
            <GitCompareArrows className="size-4" />
            {selected ? text("Geselecteerd", "Selected") : text("Vergelijken", "Compare")}
          </Button>
          {editable && !option.convertedTravelItemId && option.status !== "rejected" && (
            <Button type="button" size="sm" onClick={onConvert} disabled={disabled}>
              <Check className="size-4" />
              {text("Kiezen", "Choose")}
            </Button>
          )}
          {editable && option.status !== "rejected" && !option.convertedTravelItemId && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={text("Archiveren", "Archive")}
              onClick={onArchive}
              disabled={disabled}
            >
              <Archive className="size-4" />
            </Button>
          )}
          {editable && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={text("Verwijderen", "Delete")}
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Comparison({
  options,
  base,
  rates,
  text,
}: {
  options: TravelOption[];
  base: string;
  rates: Rates;
  text: Text;
}) {
  return (
    <Card className="surface">
      <CardHeader>
        <CardTitle className="text-base">{text("Vergelijking", "Comparison")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {options.map((option) => {
            const amount =
              option.amount == null
                ? undefined
                : convert(option.amount, option.currency ?? base, base, rates);
            return (
              <div key={option.id} className="rounded-xl border p-4">
                <p className="break-anywhere font-semibold">{option.title}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row
                    label={text("Prijs", "Price")}
                    value={amount == null ? "—" : formatMoney(amount, base)}
                  />
                  <Row
                    label={text("Toeslagen", "Charges")}
                    value={
                      option.chargesIncluded
                        ? text("Inbegrepen", "Included")
                        : text("Onbekend", "Unknown")
                    }
                  />
                  <Row
                    label={text("Duur", "Duration")}
                    value={option.durationMinutes ? formatDuration(option.durationMinutes) : "—"}
                  />
                  <Row
                    label={text("Afstand", "Distance")}
                    value={option.distanceKm == null ? "—" : `${option.distanceKm} km`}
                  />
                  <Row
                    label={text("Annulering", "Cancellation")}
                    value={option.cancellation || "—"}
                  />
                </dl>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`space-y-1 text-sm ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="break-anywhere">{value}</strong>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-anywhere">{value}</dd>
    </div>
  );
}
function formatDuration(minutes: number) {
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}u ${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();
}
function typeEntries(text: Text): [TravelItemType, string][] {
  return [
    ["lodging", text("Verblijf", "Accommodation")],
    ["flight", text("Vlucht", "Flight")],
    ["transport", text("Trein, bus of vervoer", "Train, bus or transport")],
    ["car_rental", text("Huurauto", "Rental car")],
    ["activity", text("Activiteit", "Activity")],
  ];
}
function typeLabel(type: TravelItemType, text: Text) {
  return typeEntries(text).find(([value]) => value === type)?.[1] ?? type;
}
function statusLabel(status: TravelOption["status"], text: Text) {
  return status === "selected"
    ? text("Gekozen", "Chosen")
    : status === "rejected"
      ? text("Gearchiveerd", "Archived")
      : text("Kandidaat", "Candidate");
}
