import { useMemo, useState } from "react";
import { BedDouble, ExternalLink, Loader2, MapPin, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findTripHotelGaps, type HotelGap, type TripHotelGap } from "@/lib/hotel-gaps";
import { searchNearbyHotels, type HotelSearchResult } from "@/lib/hotel-search.functions";
import { normalizeTravelOption } from "@/lib/trip-options";
import type { Trip } from "@/lib/types";
import { uid } from "@/lib/workspace";

type Text = (nl: string, en: string) => string;
type Props = { trip: Trip; editable: boolean; save: (fn: (trip: Trip) => Trip) => Promise<void>; text: Text };

export function HotelGapFinder({ trip, editable, save, text }: Props) {
  const gaps = useMemo(() => findTripHotelGaps(trip), [trip]);
  const tripNights = useMemo(() => {
    const start = Date.parse(`${trip.start}T00:00:00Z`), end = Date.parse(`${trip.end}T00:00:00Z`);
    return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.min(366, Math.floor((end - start) / 86_400_000)) : 0;
  }, [trip.start, trip.end]);
  const missingNights = gaps.reduce((sum, item) => sum + item.nights, 0);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [locationEditors, setLocationEditors] = useState<Record<string, boolean>>({});
  const [gap, setGap] = useState<HotelGap>();
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string>();

  async function search(item: TripHotelGap) {
    const stopId = locations[item.id] ?? item.suggestedStopId;
    const stop = trip.stops.find((candidate) => candidate.id === stopId);
    if (!stop) {
      toast.error(text("Kies eerst waar je deze nacht wilt overnachten.", "First choose where you want to stay that night."));
      return;
    }
    const resolved: HotelGap = { ...item, stopId: stop.id, stopName: stop.name, country: stop.country, lat: stop.lat, lon: stop.lon };
    setGap(resolved); setResults([]); setLoading(true);
    try {
      const found = await searchNearbyHotels({ data: { tripId: trip.id, lat: stop.lat, lon: stop.lon } });
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
      const option = normalizeTravelOption({ id: uid(), type: "lodging", title: result.name, startDate: gap.startDate, endDate: gap.endDate, provider: "OpenStreetMap", distanceKm: result.distanceKm, sourceUrl: result.website ?? result.osmUrl, notes: text("Zoekresultaat; controleer prijs en beschikbaarheid bij de aanbieder.", "Search result; verify price and availability with the provider."), details: { locationName: `${gap.stopName}, ${gap.country}` }, status: "candidate", checkedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
      await save((current) => ({ ...current, travelOptions: [...(current.travelOptions ?? []), option] }));
      toast.success(text("Kandidaat toegevoegd. Zet hem na het boeken in de Vergelijker om naar een boeking.", "Candidate added. After booking, convert it to a booking in Comparison."));
    } catch { toast.error(text("Hotel kon niet worden toegevoegd.", "Hotel could not be added.")); }
    finally { setSaving(undefined); }
  }

  return <>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="size-5" />{text("Hotelcontrole en zoeken", "Accommodation check and search")}</CardTitle></CardHeader><CardContent className="space-y-5">
      <p className="text-sm text-muted-foreground">{text("GlobeTrotr controleert iedere nacht tussen de start- en einddatum. Bij een ontbrekend verblijf stellen we de waarschijnlijkste routeplaats voor. Klopt die niet, dan kies je zelf waar je wilt slapen.", "GlobeTrotr checks every night between the start and end date. For a missing stay, we suggest the most likely route location. If it is not right, choose where you want to stay.")}</p>
      <div className="grid gap-2 text-sm sm:grid-cols-3"><Stat label={text("Reisnachten", "Trip nights")} value={tripNights} /><Stat label={text("Gedekte nachten", "Covered nights")} value={Math.max(0, tripNights - missingNights)} /><Stat label={text("Ontbrekende nachten", "Missing nights")} value={missingNights} /></div>
      {tripNights === 0 && <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">{text("Stel eerst een geldige start- en einddatum in.", "Set a valid start and end date first.")}</p>}
      {tripNights > 0 && gaps.length === 0 && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{text("Alle reisnachten worden door een verblijfsboeking gedekt.", "Every trip night is covered by an accommodation booking.")}</p>}
      {gaps.map((item) => {
        const selected = locations[item.id] ?? item.suggestedStopId ?? "";
        const suggestion = trip.stops.find((stop) => stop.id === item.suggestedStopId);
        const editing = !suggestion || Boolean(locationEditors[item.id]);
        return <div key={item.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1fr)_auto] md:items-end"><div><strong>{item.startDate} – {item.endDate}</strong><p className="text-sm text-muted-foreground">{item.nights} {item.nights === 1 ? text("nacht zonder verblijf", "night without accommodation") : text("nachten zonder verblijf", "nights without accommodation")}</p></div><div className="space-y-1 text-sm"><span className="font-medium">{suggestion ? text("Voorgestelde slaapplaats", "Suggested overnight location") : text("Waar wil je overnachten?", "Where do you want to stay?")}</span>{editing ? <select aria-label={text("Slaapplaats", "Overnight location")} className="h-10 w-full rounded-md border bg-background px-3" value={selected} disabled={!editable} onChange={(event) => setLocations((current) => ({ ...current, [item.id]: event.target.value }))}><option value="">{text("Kies een routeplaats", "Choose a route location")}</option>{trip.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}{stop.country ? ` · ${stop.country}` : ""}</option>)}</select> : <div className="flex min-h-10 items-center justify-between gap-2 rounded-md border bg-muted/40 px-3"><span><strong>{suggestion.name}</strong>{suggestion.country ? ` · ${suggestion.country}` : ""}</span><Button type="button" size="sm" variant="ghost" disabled={!editable} onClick={() => setLocationEditors((current) => ({ ...current, [item.id]: true }))}><Pencil className="size-3.5" />{text("Wijzigen", "Change")}</Button></div>}{item.confidence === "route" && <span className="block text-xs text-muted-foreground">{text("Bepaald via de routepositie op deze datum. Pas alleen aan als je elders slaapt.", "Based on your route position on this date. Change it only if you stay elsewhere.")}</span>}</div><Button disabled={!editable || loading || !selected} onClick={() => void search(item)}><Search className="size-4" />{text("Zoek verblijven", "Find stays")}</Button></div>;
      })}
      <p className="text-xs text-muted-foreground">{text("Een zoekresultaat is nog geen boeking en dekt daarom geen nacht. Controleer prijs en beschikbaarheid altijd bij de aanbieder.", "A search result is not a booking and therefore does not cover a night. Always verify price and availability with the provider.")}</p>
    </CardContent></Card>
    <Dialog open={Boolean(gap)} onOpenChange={(open) => { if (!open) setGap(undefined); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{text("Verblijven rond", "Accommodation near")} {gap?.stopName}</DialogTitle></DialogHeader>{gap && <p className="text-sm text-muted-foreground">{gap.startDate} – {gap.endDate} · {text("gesorteerd op afstand", "ordered by distance")}</p>}{loading ? <div className="flex items-center justify-center gap-2 p-10"><Loader2 className="size-5 animate-spin" />{text("Verblijven zoeken…", "Searching accommodation…")}</div> : !results.length ? <p className="py-8 text-center text-sm text-muted-foreground">{text("Geen benoemde verblijven binnen 15 km gevonden.", "No named accommodation found within 15 km.")}</p> : <div className="space-y-2">{results.map((result) => <div key={result.id} className="rounded-lg border p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{result.name}</strong><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{result.kind.replaceAll("_", " ")} · {result.distanceKm} km{result.stars ? ` · ${result.stars}★` : ""}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={result.website ?? result.osmUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{text("Bekijken", "View")}</a></Button><Button size="sm" disabled={!editable || Boolean(saving)} onClick={() => void add(result)}>{saving === result.id && <Loader2 className="size-4 animate-spin" />}{text("Bewaar als kandidaat", "Save as candidate")}</Button></div></div></div>)}</div>}<p className="text-xs text-muted-foreground">© <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></p></DialogContent></Dialog>
  </>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-muted/60 p-3"><strong className="block text-xl">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>; }
