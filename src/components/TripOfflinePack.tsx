import { useEffect, useState } from "react";
import { Download, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Expense, Trip } from "@/lib/types";
import { createOfflineTripPack, deleteOfflineTrip, getOfflineTrip, removeQueuedOfflineExpenses, saveOfflineTrip, type OfflineExpense } from "@/lib/offline-trip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { trip: Trip; text: (nl: string, en: string) => string; canManageExpenses: boolean; payers: Array<{ id: string; name: string }>; syncExpenses: (expenses: Expense[]) => Promise<void> };

export function TripOfflinePack({ trip, text, canManageExpenses, payers, syncExpenses }: Props) {
  const [savedAt, setSavedAt] = useState<string>();
  const [queued, setQueued] = useState<OfflineExpense[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => getOfflineTrip(trip.id).then((pack) => { setSavedAt(pack?.savedAt); setQueued(pack?.queuedExpenses ?? []); }).catch(() => undefined);
    void refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); };
  }, [trip.id]);

  async function save() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator)) throw new Error("OFFLINE_UNAVAILABLE");
      await navigator.serviceWorker.register("/push-sw.js");
      await navigator.serviceWorker.ready;
      await navigator.storage?.persist?.().catch(() => false);
      const previous = await getOfflineTrip(trip.id);
      const pack = createOfflineTripPack(trip, document.documentElement.lang, canManageExpenses ? payers : [], previous?.queuedExpenses ?? []);
      await saveOfflineTrip(pack);
      setSavedAt(pack.savedAt);
      setQueued(pack.queuedExpenses);
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
      setSavedAt(undefined);
      setQueued([]);
      toast.success(text("Offline gegevens zijn van dit apparaat verwijderd.", "Offline data removed from this device."));
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    if (!queued.length || !navigator.onLine) return;
    setBusy(true);
    try {
      await syncExpenses(queued.map(({ queuedAt: _queuedAt, ...expense }) => expense));
      await removeQueuedOfflineExpenses(trip.id, queued.map((item) => item.id));
      setQueued([]);
      toast.success(text("Offline uitgaven zijn gesynchroniseerd.", "Offline expenses have been synced."));
    } catch {
      toast.error(text("Synchroniseren is gestopt. De lokale uitgaven blijven bewaard; herlaad de reis en probeer opnieuw.", "Sync stopped. Your local expenses remain saved; reload the trip and try again."), { duration: 8000 });
    } finally { setBusy(false); }
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
      {queued.length > 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><strong>{queued.length} {text("offline uitgave(n) wachten", "offline expense(s) waiting")}</strong><p className="mt-1 text-xs">{text("Synchronisatie gebeurt alleen wanneer je hier bewust voor kiest.", "Sync only starts when you explicitly choose it here.")}</p></div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={busy}>
          {savedAt ? <RefreshCw className="size-4"/> : <Download className="size-4"/>}
          {savedAt ? text("Bijwerken", "Update") : text("Offline bewaren", "Save offline")}
        </Button>
        {savedAt && <>
          <Button type="button" size="sm" variant="outline" asChild><a href={`/offline.html?trip=${encodeURIComponent(trip.id)}`}><ExternalLink className="size-4"/>{text("Open offline overzicht", "Open offline view")}</a></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void remove()} disabled={busy}><Trash2 className="size-4"/>{text("Verwijderen", "Remove")}</Button>
        </>}
        {queued.length > 0 && canManageExpenses && <Button type="button" size="sm" variant="secondary" onClick={() => void sync()} disabled={busy || !navigator.onLine}><RefreshCw className="size-4"/>{text("Uitgaven synchroniseren", "Sync expenses")}</Button>}
      </div>
    </CardContent>
  </Card>;
}
