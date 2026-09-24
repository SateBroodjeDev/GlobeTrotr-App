import { useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarDays, CheckCircle2, ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configuredRouteNights, findHotelGaps, type HotelGap } from "@/lib/hotel-gaps";
import { searchNearbyHotels, type HotelSearchResult } from "@/lib/hotel-search.functions";
import { normalizeTravelOption } from "@/lib/trip-options";
import type { Stop, Trip } from "@/lib/types";
import { uid } from "@/lib/workspace";

type Text = (nl: string, en: string) => string;
type Props = { trip: Trip; editable: boolean; save: (fn: (trip: Trip) => Trip) => Promise<void>; text: Text };

export function HotelGapFinder({ trip, editable, save, text }: Props) {
  const gaps = useMemo(() => findHotelGaps(trip.stops, trip.travelItems), [trip.stops, trip.travelItems]);
  const configuredNights = useMemo(() => configuredRouteNights(trip.stops), [trip.stops]);
  const incompleteStops = useMemo(() => trip.stops.filter((stop) => !stop.arrive || !Number.isFinite(stop.nights) || Number(stop.nights) < 1), [trip.stops]);
  const bookedStays = (trip.travelItems ?? []).filter((item) => item.type === "lodging").length;
  const [gap, setGap] = useState<HotelGap>();
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string>();

  async function search(item: HotelGap) {
    setGap(item); setResults([]); setLoading(true);
    try {
      const found = await searchNearbyHotels({ data: { tripId: trip.id, lat: item.lat, lon: item.lon } });
      setResults(found.results);
    } catch (error) {
      toast.error(error instanceof Error && error.message === "HOTEL_SEARCH_RATE_LIMIT"
        ? text("Je zoekt te snel. Probeer het over een minuut opnieuw.", "You are searching too quickly. Try again in a minute.")
        : text("Hotels zoeken is tijdelijk niet beschikbaar.", "Hotel search is temporarily unavailable."));
    } finally { setLoading(false); }
  }

  async function add(result: HotelSearchResult) {
    if (!gap) return;
    setSaving(result.id);
    try {
      const option = normalizeTravelOption({
        id: uid(), type: "lodging", title: result.name, startDate: gap.startDate, endDate: gap.endDate,
        provider: "OpenStreetMap", distanceKm: result.distanceKm, sourceUrl: result.website ?? result.osmUrl,
        notes: text("Zoekresultaat; controleer prijs en beschikbaarheid bij de aanbieder.", "Search result; verify price and availability with the provider."),
        details: { locationName: `${gap.stopName}, ${gap.country}` }, status: "candidate",
        checkedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      });
      await save((current) => ({ ...current, travelOptions: [...(current.travelOptions ?? []), option] }));
      toast.success(text("Kandidaat toegevoegd. Zet hem na het boeken in de Vergelijker om naar een boeking.", "Candidate added. After booking, convert it to a booking in Comparison."));
    } catch { toast.error(text("Hotel kon niet worden toegevoegd.", "Hotel could not be added.")); }
    finally { setSaving(undefined); }
  }

  return <>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="size-5" />{text("Hotelcontrole en zoeken", "Accommodation check and search")}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{text("GlobeTrotr controleert je route per nacht. Het zoeken toont benoemde verblijven binnen 5 km, gesorteerd op afstand. Dit zijn zoekresultaten en geen persoonlijke of betaalde aanbevelingen.", "GlobeTrotr checks your route night by night. Search shows named accommodation within 5 km, ordered by distance. These are search results, not personal or paid recommendations.")}</p>
        <ol className="grid gap-2 text-sm md:grid-cols-3">
          <Step icon={CalendarDays} number="1" value={text("Vul aankomst en nachten per bestemming in.", "Set arrival and nights for each destination.")} />
          <Step icon={Search} number="2" value={text("Zoek voor nachten zonder boeking.", "Search for nights without a booking.")} />
          <Step icon={CheckCircle2} number="3" value={text("Vergelijk, boek extern en zet je keuze om naar een boeking.", "Compare, book externally and convert your choice to a booking.")} />
        </ol>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <Stat label={text("Ingestelde nachten", "Configured nights")} value={configuredNights} />
          <Stat label={text("Geboekte verblijven", "Booked stays")} value={bookedStays} />
          <Stat label={text("Ontbrekende nachten", "Missing nights")} value={gaps.reduce((sum, item) => sum + item.nights, 0)} />
        </div>
        {incompleteStops.length > 0 && <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div><strong>{text("Maak eerst de route controleerbaar", "Complete the route first")}</strong><p className="mt-1 text-sm text-muted-foreground">{text("Deze bestemmingen missen een aankomstdatum of aantal nachten. Vul ze hieronder in; daarna verschijnen ontbrekende verblijven automatisch.", "These destinations need an arrival date or number of nights. Complete them below and missing accommodation will appear automatically.")}</p></div>
          {incompleteStops.map((stop) => <StopScheduleRow key={stop.id} stop={stop} editable={editable} save={save} text={text} />)}
        </div>}
        {configuredNights > 0 && gaps.length === 0 && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{text("Alle controleerbare routenachten worden door een verblijfsboeking gedekt.", "Every route night that can be checked is covered by an accommodation booking.")}</p>}
        {gaps.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{item.stopName}</strong><p className="text-sm text-muted-foreground">{item.startDate} – {item.endDate} · {item.nights} {item.nights === 1 ? text("nacht", "night") : text("nachten", "nights")}</p></div><Button disabled={!editable || loading} onClick={() => search(item)}><Search className="size-4" />{text("Zoek verblijven voor deze nachten", "Find stays for these nights")}</Button></div>)}
        <p className="text-xs text-muted-foreground">{text("Een resultaat in de Vergelijker is nog geen boeking en dekt daarom geen nacht. GlobeTrotr toont geen live prijs of beschikbaarheid; controleer en boek altijd bij de aanbieder.", "A result in Comparison is not yet a booking and therefore does not cover a night. GlobeTrotr does not show live prices or availability; always verify and book with the provider.")}</p>
      </CardContent>
    </Card>
    <Dialog open={Boolean(gap)} onOpenChange={(open) => { if (!open) setGap(undefined); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{text("Verblijven rond", "Accommodation near")} {gap?.stopName}</DialogTitle></DialogHeader>
      {gap && <p className="text-sm text-muted-foreground">{gap.startDate} – {gap.endDate} · {text("gesorteerd op afstand tot de bestemming", "ordered by distance from the destination")}</p>}
      {loading ? <div className="flex items-center justify-center gap-2 p-10"><Loader2 className="size-5 animate-spin" />{text("Verblijven zoeken…", "Searching accommodation…")}</div> : !results.length ? <p className="py-8 text-center text-sm text-muted-foreground">{text("Geen benoemde verblijven binnen 5 km gevonden.", "No named accommodation found within 5 km.")}</p> : <div className="space-y-2">{results.map((result) => <div key={result.id} className="rounded-lg border p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{result.name}</strong><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{result.kind.replaceAll("_", " ")} · {result.distanceKm} km{result.stars ? ` · ${result.stars}★` : ""}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={result.website ?? result.osmUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{text("Bij aanbieder bekijken", "View provider")}</a></Button><Button size="sm" disabled={!editable || Boolean(saving)} onClick={() => add(result)}>{saving === result.id && <Loader2 className="size-4 animate-spin" />}{text("Bewaar als kandidaat", "Save as candidate")}</Button></div></div></div>)}</div>}
      <p className="text-xs text-muted-foreground">© <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></p>
    </DialogContent></Dialog>
  </>;
}

function StopScheduleRow({ stop, editable, save, text }: { stop: Stop; editable: boolean; save: Props["save"]; text: Text }) {
  const [arrive, setArrive] = useState(stop.arrive ?? "");
  const [nights, setNights] = useState(stop.nights && stop.nights > 0 ? String(stop.nights) : "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setArrive(stop.arrive ?? ""); setNights(stop.nights && stop.nights > 0 ? String(stop.nights) : ""); }, [stop.arrive, stop.nights]);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(arrive) && Number.isInteger(Number(nights)) && Number(nights) >= 1 && Number(nights) <= 366;
  async function submit() {
    if (!valid) return;
    setBusy(true);
    try {
      await save((trip) => ({ ...trip, stops: trip.stops.map((item) => item.id === stop.id ? { ...item, arrive, nights: Number(nights) } : item) }));
      toast.success(text("Verblijfsperiode opgeslagen.", "Stay period saved."));
    } catch { toast.error(text("Verblijfsperiode kon niet worden opgeslagen.", "Stay period could not be saved.")); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-3 rounded-lg bg-background p-3 sm:grid-cols-[minmax(8rem,1fr)_10rem_7rem_auto] sm:items-end"><div className="min-w-0"><span className="block truncate font-medium">{stop.name}</span><span className="text-xs text-muted-foreground">{stop.country}</span></div><label className="space-y-1"><Label>{text("Aankomst", "Arrival")}</Label><Input type="date" value={arrive} disabled={!editable || busy} onChange={(event) => setArrive(event.target.value)} /></label><label className="space-y-1"><Label>{text("Nachten", "Nights")}</Label><Input type="number" min={1} max={366} value={nights} disabled={!editable || busy} onChange={(event) => setNights(event.target.value)} /></label><Button type="button" size="sm" disabled={!editable || busy || !valid} onClick={() => void submit()}>{busy && <Loader2 className="size-4 animate-spin" />}{text("Opslaan", "Save")}</Button></div>;
}

function Step({ icon: Icon, number, value }: { icon: typeof Search; number: string; value: string }) {
  return <li className="flex gap-3 rounded-lg border p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{number}</span><span><Icon className="mb-1 size-4 text-primary" />{value}</span></li>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-muted/60 p-3"><strong className="block text-xl">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>;
}
