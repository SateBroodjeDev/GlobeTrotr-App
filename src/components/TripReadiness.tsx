import { BedDouble, CheckCircle2, CircleDashed, ListChecks, MapPinned, PackageCheck } from "lucide-react";
import type { Trip } from "@/lib/types";
import { getTripReadiness } from "@/lib/trip-readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TripReadiness({ trip, text }: { trip: Trip; text: (nl: string, en: string) => string }) {
  const readiness = getTripReadiness(trip);
  const rows = [
    { icon: MapPinned, ready: readiness.stops > 0, label: text("Route", "Route"), value: readiness.stops ? `${readiness.stops} ${text("bestemming(en)", "destination(s)")}` : text("Nog geen bestemmingen", "No destinations yet") },
    { icon: ListChecks, ready: readiness.tripDays > 0 && readiness.plannedDays >= readiness.tripDays, label: text("Reisschema", "Trip schedule"), value: readiness.tripDays ? `${readiness.plannedDays}/${readiness.tripDays} ${text("reisdagen gedekt door route, boekingen of dagplanning", "trip days covered by route, bookings or daily plans")}` : text("Controleer de reisdatums", "Check the trip dates") },
    { icon: BedDouble, ready: readiness.routeNights > 0 && readiness.missingHotelNights === 0, label: text("Overnachtingen", "Accommodation"), value: readiness.routeNights === 0 ? text("Stel eerst nachten per bestemming in", "Set nights per destination first") : readiness.missingHotelNights ? `${readiness.missingHotelNights} ${text("nacht(en) zonder verblijf", "night(s) without accommodation")}` : text("Alle ingestelde nachten gedekt", "All configured nights covered") },
    { icon: PackageCheck, ready: readiness.packingTotal > 0 && readiness.packingDone === readiness.packingTotal, label: text("Paklijst", "Packing list"), value: readiness.packingTotal ? `${readiness.packingDone}/${readiness.packingTotal} ${text("afgevinkt", "completed")}` : text("Nog geen paklijst", "No packing list yet") },
  ];

  return <Card className="surface"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4"/>{text("Vertrekcheck", "Departure check")}</CardTitle></CardHeader><CardContent className="space-y-2">
    {rows.map(({ icon: Icon, ready, label, value }) => <div key={label} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">{ready ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600"/> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-amber-600"/>}<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground"/><div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="break-words text-xs text-muted-foreground">{value}</p></div></div>)}
  </CardContent></Card>;
}
