import { useMemo, useState } from "react";
import { BedDouble, ExternalLink, Loader2, MapPin, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createHotelGapBooking, findTripHotelGaps, type HotelGap, type TripHotelGap } from "@/lib/hotel-gaps";
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
  const [bookingResult, setBookingResult] = useState<HotelSearchResult>();
  const [bookingReference, setBookingReference] = useState("");

  async function search(item: TripHotelGap) {
    const stopId = locations[item.id] ?? item.suggestedStopId;
    const stop = trip.stops.find((candidate) => candidate.id === stopId);
    const location = stop ?? item.suggestedLocation;
    if (!location) {
      toast.error(text("Kies eerst waar je wilt overnachten.", "First choose where you want to stay."));
      return;
    }
    setGap({ ...item, stopId: stop?.id ?? `booking:${item.id}`, stopName: location.name, country: location.country, lat: location.lat, lon: location.lon });
    setResults([]); setLoading(true);
    try {
      const found = await searchNearbyHotels({ data: { tripId: trip.id, lat: location.lat, lon: location.lon } });
      setResults(found.results);
    } catch (error) {
      toast.error(error instanceof Error && error.message === "HOTEL_SEARCH_RATE_LIMIT" ? text("Je zoekt te snel. Probeer het over een minuut opnieuw.", "You are searching too quickly. Try again in a minute.") : text("Hotels zoeken is tijdelijk niet beschikbaar.", "Hotel search is temporarily unavailable."));
    } finally { setLoading(false); }
  }

  async function addCandidate(result: HotelSearchResult) {
    if (!gap) return;
    setSaving(result.id);
    try {
      const option = normalizeTravelOption({ id: uid(), type: "lodging", title: result.name, startDate: gap.startDate, endDate: gap.endDate, provider: "OpenStreetMap", distanceKm: result.distanceKm, sourceUrl: result.website ?? result.osmUrl, notes: text("Zoekresultaat; controleer prijs en beschikbaarheid bij de aanbieder.", "Search result; verify price and availability with the provider."), details: { locationName: `${gap.stopName}, ${gap.country}` }, status: "candidate", checkedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
      await save((current) => ({ ...current, travelOptions: [...(current.travelOptions ?? []), option] }));
      toast.success(text("Kandidaat toegevoegd. Zet hem na het boeken in de Vergelijker om naar een boeking.", "Candidate added. After booking, convert it to a booking in Comparison."));
    } catch { toast.error(text("Hotel kon niet worden toegevoegd.", "Hotel could not be added.")); }
    finally { setSaving(undefined); }
  }

  async function confirmBooking() {
    if (!gap || !bookingResult) return;
    setSaving(bookingResult.id);
    try {
      const booking = createHotelGapBooking({ id: uid(), name: bookingResult.name, startDate: gap.startDate, endDate: gap.endDate, location: { name: gap.stopName, country: gap.country, lat: gap.lat, lon: gap.lon }, provider: bookingResult.name, bookingReference, sourceUrl: bookingResult.website ?? bookingResult.osmUrl, note: text("Extern geboekt; controleer de boekingsgegevens in het reisschema.", "Booked externally; verify the booking details in the itinerary.") });
      await save((current) => ({ ...current, travelItems: [...(current.travelItems ?? []), booking] }));
      setBookingResult(undefined); setBookingReference(""); setGap(undefined);
      toast.success(text("Verblijfsboeking toegevoegd. De hotelcontrole is direct bijgewerkt.", "Accommodation booking added. The accommodation check has been updated."));
    } catch { toast.error(text("Verblijfsboeking kon niet worden toegevoegd.", "Accommodation booking could not be added.")); }
    finally { setSaving(undefined); }
  }

  return <>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="size-5" />{text("Hotelcontrole en zoeken", "Accommodation check and search")}</CardTitle></CardHeader><CardContent className="space-y-5">
      <p className="text-sm text-muted-foreground">{text("GlobeTrotr controleert iedere nacht. Bij een ontbrekend verblijf stellen we de waarschijnlijkste routeplaats voor.", "GlobeTrotr checks every night. For a missing stay, we suggest the most likely route location.")}</p>
      <div className="grid gap-2 text-sm sm:grid-cols-3"><Stat label={text("Reisnachten", "Trip nights")} value={tripNights} /><Stat label={text("Gedekte nachten", "Covered nights")} value={Math.max(0, tripNights - missingNights)} /><Stat label={text("Ontbrekende nachten", "Missing nights")} value={missingNights} /></div>
      {tripNights === 0 && <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">{text("Stel eerst een geldige start- en einddatum in.", "Set a valid start and end date first.")}</p>}
      {tripNights > 0 && gaps.length === 0 && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{text("Alle reisnachten worden door een verblijfsboeking gedekt.", "Every trip night is covered by an accommodation booking.")}</p>}
      {gaps.map((item) => <GapRow key={item.id} item={item} trip={trip} editable={editable} loading={loading} selected={locations[item.id] ?? item.suggestedStopId ?? ""} editing={Boolean(locationEditors[item.id])} text={text} onSelect={(value) => setLocations((current) => ({ ...current, [item.id]: value }))} onEdit={() => setLocationEditors((current) => ({ ...current, [item.id]: true }))} onSearch={() => void search(item)} />)}
      <p className="text-xs text-muted-foreground">{text("Een zoekresultaat is nog geen boeking. Controleer prijs en beschikbaarheid altijd bij de aanbieder.", "A search result is not a booking. Always verify price and availability with the provider.")}</p>
    </CardContent></Card>
    <Dialog open={Boolean(gap && !bookingResult)} onOpenChange={(open) => { if (!open && !bookingResult) setGap(undefined); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{text("Verblijven rond", "Accommodation near")} {gap?.stopName}</DialogTitle></DialogHeader>{gap && <p className="text-sm text-muted-foreground">{gap.startDate} – {gap.endDate} · {gap.nights} {gap.nights === 1 ? text("nacht", "night") : text("nachten", "nights")}</p>}{loading ? <div className="flex items-center justify-center gap-2 p-10"><Loader2 className="size-5 animate-spin" />{text("Verblijven zoeken…", "Searching accommodation…")}</div> : !results.length ? <p className="py-8 text-center text-sm text-muted-foreground">{text("Geen benoemde verblijven binnen 15 km gevonden.", "No named accommodation found within 15 km.")}</p> : <div className="space-y-2">{results.map((result) => <ResultRow key={result.id} result={result} editable={editable} saving={saving} text={text} onCandidate={() => void addCandidate(result)} onBooked={() => { setBookingReference(""); setBookingResult(result); }} />)}</div>}<p className="text-xs text-muted-foreground">© <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></p></DialogContent></Dialog>
    <Dialog open={Boolean(bookingResult)} onOpenChange={(open) => { if (!open) setBookingResult(undefined); }}><DialogContent><DialogHeader><DialogTitle>{text("Verblijfsboeking bevestigen", "Confirm accommodation booking")}</DialogTitle></DialogHeader>{gap && bookingResult && <div className="space-y-4"><div className="rounded-lg bg-muted/60 p-3 text-sm"><strong className="block">{bookingResult.name}</strong><span>{gap.startDate} – {gap.endDate} · {gap.nights} {gap.nights === 1 ? text("nacht", "night") : text("nachten", "nights")}</span><span className="block text-muted-foreground">{gap.stopName}{gap.country ? ` · ${gap.country}` : ""}</span></div><p className="text-sm text-muted-foreground">{text("Gebruik dit alleen nadat je bij de aanbieder hebt geboekt.", "Use this only after booking with the provider.")}</p><label className="space-y-1"><span className="text-sm font-medium">{text("Boekingsnummer (optioneel)", "Booking reference (optional)")}</span><Input value={bookingReference} maxLength={160} onChange={(event) => setBookingReference(event.target.value)} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setBookingResult(undefined)}>{text("Annuleren", "Cancel")}</Button><Button disabled={Boolean(saving)} onClick={() => void confirmBooking()}>{saving && <Loader2 className="size-4 animate-spin" />}{text("Als boeking toevoegen", "Add as booking")}</Button></div></div>}</DialogContent></Dialog>
  </>;
}

function GapRow({ item, trip, editable, loading, selected, editing, text, onSelect, onEdit, onSearch }: { item: TripHotelGap; trip: Trip; editable: boolean; loading: boolean; selected: string; editing: boolean; text: Text; onSelect: (value: string) => void; onEdit: () => void; onSearch: () => void }) {
  const suggestion = trip.stops.find((stop) => stop.id === item.suggestedStopId) ?? item.suggestedLocation;
  const showSelect = !suggestion || editing;
  return <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1fr)_auto] md:items-end"><div><strong>{item.startDate} – {item.endDate}</strong><p className="text-sm text-muted-foreground">{item.nights} {item.nights === 1 ? text("nacht zonder verblijf", "night without accommodation") : text("nachten zonder verblijf", "nights without accommodation")}</p></div><div className="space-y-1 text-sm"><span className="font-medium">{suggestion ? text("Waarschijnlijke slaapplaats", "Likely overnight location") : text("Waar wil je overnachten?", "Where do you want to stay?")}</span>{showSelect ? <select aria-label={text("Slaapplaats", "Overnight location")} className="h-10 w-full rounded-md border bg-background px-3" value={selected} disabled={!editable} onChange={(event) => onSelect(event.target.value)}><option value="">{text("Kies een routeplaats", "Choose a route location")}</option>{trip.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}{stop.country ? ` · ${stop.country}` : ""}</option>)}</select> : <div className="flex min-h-10 items-center justify-between gap-2 rounded-md border bg-muted/40 px-3"><span><strong>{suggestion.name}</strong>{suggestion.country ? ` · ${suggestion.country}` : ""}</span><Button type="button" size="sm" variant="ghost" disabled={!editable} onClick={onEdit}><Pencil className="size-3.5" />{text("Wijzigen", "Change")}</Button></div>}</div><Button disabled={!editable || loading || (!selected && !item.suggestedLocation)} onClick={onSearch}><Search className="size-4" />{text("Zoek verblijven", "Find stays")}</Button></div>;
}

function ResultRow({ result, editable, saving, text, onCandidate, onBooked }: { result: HotelSearchResult; editable: boolean; saving?: string; text: Text; onCandidate: () => void; onBooked: () => void }) {
  return <div className="rounded-lg border p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{result.name}</strong><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{result.kind.replaceAll("_", " ")} · {result.distanceKm} km{result.stars ? ` · ${result.stars}★` : ""}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={result.website ?? result.osmUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{text("Bekijken", "View")}</a></Button><Button variant="outline" size="sm" disabled={!editable || Boolean(saving)} onClick={onBooked}>{text("Al geboekt", "Already booked")}</Button><Button size="sm" disabled={!editable || Boolean(saving)} onClick={onCandidate}>{saving === result.id && <Loader2 className="size-4 animate-spin" />}{text("Bewaar als kandidaat", "Save as candidate")}</Button></div></div></div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-muted/60 p-3"><strong className="block text-xl">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>; }
