import { useEffect, useMemo, useState } from "react";
import { CircleCheck, CloudOff, Database, Download, ExternalLink, RefreshCw, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import type { Expense, Trip } from "@/lib/types";
import { createOfflineTripPack, deleteOfflineTrip, getOfflineTrip, removeQueuedOfflineExpenses, saveOfflineTrip, summarizeOfflineTripPack, type OfflineTripPack } from "@/lib/offline-trip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { findOfflineExpenseConflicts } from "@/lib/offline-trip";

type Props = { trip: Trip; text: (nl: string, en: string) => string; canManageExpenses: boolean; payers: Array<{ id: string; name: string }>; syncExpenses: (expenses: Expense[]) => Promise<void> };

export function TripOfflinePack({ trip, text, canManageExpenses, payers, syncExpenses }: Props) {
  const [pack, setPack] = useState<OfflineTripPack>();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [persistentStorage, setPersistentStorage] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const savedAt = pack?.savedAt;
  const queued = useMemo(() => pack?.queuedExpenses ?? [], [pack?.queuedExpenses]);
  const summary = pack ? summarizeOfflineTripPack(pack) : undefined;
  const conflicts = useMemo(() => new Set(findOfflineExpenseConflicts(trip.expenses, queued)), [queued, trip.expenses]);

  useEffect(() => {
    setSelectedExpenses((current) => new Set(queued.filter((item) => !conflicts.has(item.id) && (current.size === 0 || current.has(item.id))).map((item) => item.id)));
  }, [conflicts, queued]);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      void getOfflineTrip(trip.id).then(setPack).catch(() => undefined);
      void navigator.storage?.persisted?.().then(setPersistentStorage).catch(() => undefined);
    };
    void refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); window.removeEventListener("focus", refresh); };
  }, [trip.id]);

  async function save() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator)) throw new Error("OFFLINE_UNAVAILABLE");
      await navigator.serviceWorker.register("/push-sw.js");
      await navigator.serviceWorker.ready;
      const persisted = await navigator.storage?.persist?.().catch(() => false);
      setPersistentStorage(persisted);
      const previous = await getOfflineTrip(trip.id);
      const pack = createOfflineTripPack(trip, document.documentElement.lang, canManageExpenses ? payers : [], previous?.queuedExpenses ?? []);
      await saveOfflineTrip(pack);
      setPack(pack);
      toast.success(text("Offline dagoverzicht is bijgewerkt.", "Offline day view updated."));
    } catch {
      toast.error(text("Offline opslaan wordt niet ondersteund door deze browser.", "Offline storage is not supported by this browser."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteOfflineTrip(trip.id);
      setPack(undefined);
      toast.success(text("Offline gegevens zijn van dit apparaat verwijderd.", "Offline data removed from this device."));
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    const chosen = queued.filter((item) => selectedExpenses.has(item.id) && !conflicts.has(item.id));
    if (!chosen.length || !online) return;
    setBusy(true);
    try {
      await syncExpenses(chosen.map(({ queuedAt: _queuedAt, ...expense }) => expense));
      await removeQueuedOfflineExpenses(trip.id, chosen.map((item) => item.id));
      setPack((current) => current ? { ...current, queuedExpenses: current.queuedExpenses.filter((item) => !selectedExpenses.has(item.id)) } : current);
      setSelectedExpenses(new Set());
      toast.success(text("Offline uitgaven zijn gesynchroniseerd.", "Offline expenses have been synced."));
    } catch {
      toast.error(text("Synchroniseren is gestopt. De lokale uitgaven blijven bewaard; herlaad de reis en probeer opnieuw.", "Sync stopped. Your local expenses remain saved; reload the trip and try again."), { duration: 8000 });
    } finally { setBusy(false); }
  }

  async function removeQueued(id: string) {
    await removeQueuedOfflineExpenses(trip.id, [id]);
    setPack((current) => current ? { ...current, queuedExpenses: current.queuedExpenses.filter((item) => item.id !== id) } : current);
    setSelectedExpenses((current) => { const next = new Set(current); next.delete(id); return next; });
  }

  return <Card className="surface">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base"><Download className="size-4"/>{text("Offline onderweg", "Offline on the go")}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{text(
        "Bewaar route, dagplanning en praktische boekingsinformatie op dit apparaat. Bedragen, boekingscodes en documenten worden niet opgeslagen.",
        "Save the route, daily schedule and practical booking details on this device. Amounts, booking references and documents are excluded.",
      )}</p>
      {savedAt && <p className="text-xs text-muted-foreground">{text("Bijgewerkt", "Updated")}: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(savedAt))}</p>}
      {summary && <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-3">
          <span className="flex items-center gap-1.5 font-medium"><Database className="size-3.5"/>{text("Op dit apparaat", "On this device")}</span>
          <p className="mt-1 text-muted-foreground">{formatBytes(summary.bytes)} · {summary.stops} {text("bestemmingen", "destinations")} · {summary.itineraryItems} {text("planningitems", "itinerary items")} · {summary.bookings} {text("boekingen", "bookings")}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <span className="flex items-center gap-1.5 font-medium">{online ? <Wifi className="size-3.5"/> : <CloudOff className="size-3.5"/>}{online ? text("Online", "Online") : text("Offline", "Offline")}</span>
          <p className="mt-1 text-muted-foreground">{queued.length ? `${queued.length} ${text("uitgave(n) wachten op synchronisatie", "expense(s) waiting to sync")}` : text("Alles op dit apparaat is bijgewerkt.", "Everything on this device is up to date.")}</p>
        </div>
        {persistentStorage !== undefined && <div className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2">
          <CircleCheck className="size-3.5"/>{persistentStorage
            ? text("De browser beschermt dit offline pakket tegen automatische opschoning.", "The browser protects this offline pack from automatic cleanup.")
            : text("De browser kan lokale gegevens bij ruimtegebrek opruimen. Werk het pakket voor vertrek opnieuw bij.", "The browser may clear local data when storage is low. Update the pack again before departure.")}
        </div>}
      </div>}
      {queued.length > 0 && <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><strong>{queued.length} {text("offline uitgave(n) wachten", "offline expense(s) waiting")}</strong><p className="text-xs">{text("Kies welke uitgaven je synchroniseert. Een conflict blijft lokaal staan totdat je het verwijdert of de servergegevens controleert.", "Choose which expenses to sync. A conflict stays local until you remove it or review the server data.")}</p>{queued.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-md bg-background/80 p-2 text-foreground"><Checkbox checked={selectedExpenses.has(item.id)} disabled={conflicts.has(item.id)} onCheckedChange={(checked) => setSelectedExpenses((current) => { const next = new Set(current); if (checked) next.add(item.id); else next.delete(item.id); return next; })} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{item.date} · {item.currency} {item.amount.toFixed(2)}{conflicts.has(item.id) ? ` · ${text("conflict", "conflict")}` : ""}</span></span><Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void removeQueued(item.id)} title={text("Lokale uitgave verwijderen", "Remove local expense")}><Trash2 className="size-4" /></Button></div>)}</div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={busy}>
          {savedAt ? <RefreshCw className="size-4"/> : <Download className="size-4"/>}
          {savedAt ? text("Bijwerken", "Update") : text("Offline bewaren", "Save offline")}
        </Button>
        {savedAt && <>
          <Button type="button" size="sm" variant="outline" asChild><a href={`/offline.html?trip=${encodeURIComponent(trip.id)}`}><ExternalLink className="size-4"/>{text("Open offline overzicht", "Open offline view")}</a></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void remove()} disabled={busy}><Trash2 className="size-4"/>{text("Verwijderen", "Remove")}</Button>
        </>}
        {queued.length > 0 && canManageExpenses && <Button type="button" size="sm" variant="secondary" onClick={() => void sync()} disabled={busy || !online || selectedExpenses.size === 0}><RefreshCw className="size-4"/>{text(`${selectedExpenses.size} synchroniseren`, `Sync ${selectedExpenses.size}`)}</Button>}
      </div>
    </CardContent>
  </Card>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
