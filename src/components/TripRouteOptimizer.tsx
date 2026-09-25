import { useMemo, useState } from "react";
import { Route as RouteIcon } from "lucide-react";
import type { Stop, Trip } from "@/lib/types";
import { proposeRouteOrder } from "@/lib/route-optimizer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  stops: Stop[];
  text: (nl: string, en: string) => string;
  save: (update: (trip: Trip) => Trip) => Promise<unknown>;
};

function distance(value: number) { return `${Math.round(value).toLocaleString()} km`; }
function duration(value: number) { const hours = Math.floor(value / 60), minutes = value % 60; return `${hours ? `${hours}u ` : ""}${minutes}m`; }

export function TripRouteOptimizer({ stops, text, save }: Props) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const proposal = useMemo(() => proposeRouteOrder(stops), [stops]);
  async function apply() {
    if (!proposal.changed) return;
    setBusy(true);
    try { await save((trip) => ({ ...trip, stops: proposal.proposed })); setOpen(false); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" size="sm" variant="outline" disabled={stops.length < 3}><RouteIcon className="size-4" />{text("Route verbeteren", "Improve route")}</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{text("Routevoorstel controleren", "Review route proposal")}</DialogTitle><DialogDescription>{text("De eerste bestemming blijft staan. Afstanden en tijden zijn rechte-lijnschattingen en vervangen geen navigatie.", "The first destination stays fixed. Distances and times are straight-line estimates and do not replace navigation.")}</DialogDescription></DialogHeader><div className="grid gap-4 md:grid-cols-2"><RouteList title={text("Huidige route", "Current route")} stops={proposal.original} total={distance(proposal.originalDistanceKm)} /><RouteList title={text("Voorgestelde route", "Proposed route")} stops={proposal.proposed} total={distance(proposal.proposedDistanceKm)} /></div>{proposal.changed ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><strong>{text("Geschatte besparing", "Estimated saving")}</strong><p className="mt-1 text-muted-foreground">{distance(proposal.savedDistanceKm)} · {duration(proposal.savedDurationMinutes)}</p></div> : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{text("De huidige volgorde is met deze berekening al logisch.", "The current order is already logical using this calculation.")}</p>}<DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{text("Annuleren", "Cancel")}</Button><Button disabled={!proposal.changed || busy} onClick={() => void apply()}>{busy ? text("Toepassen…", "Applying…") : text("Voorstel toepassen", "Apply proposal")}</Button></DialogFooter></DialogContent></Dialog>;
}

function RouteList({ title, stops, total }: { title: string; stops: Stop[]; total: string }) { return <section className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between gap-2"><strong>{title}</strong><span className="text-xs text-muted-foreground">{total}</span></div><ol className="space-y-2 text-sm">{stops.map((stop, index) => <li key={stop.id} className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs">{index + 1}</span><span>{stop.name}</span></li>)}</ol></section>; }
