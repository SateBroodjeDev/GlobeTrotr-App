import { useState } from "react";
import { CalendarDays, Copy, Download, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createCalendarFeed,
  getCalendarFeedStatus,
  revokeCalendarFeed,
} from "@/lib/calendar-feed.functions";
import { downloadTripCalendar } from "@/lib/exporters";
import { useLocale } from "@/lib/locale";
import type { Trip } from "@/lib/types";

export function TripCalendarExport({ trip, paid }: { trip: Trip; paid: boolean }) {
  const { text } = useLocale();
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(false),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  async function opened(value: boolean) {
    setOpen(value);
    if (value && paid) {
      try {
        setActive(Boolean(await getCalendarFeedStatus({ data: { tripUuid: trip.id } })));
      } catch {
        setActive(false);
      }
    }
  }
  async function create() {
    setBusy(true);
    try {
      const result = await createCalendarFeed({ data: { tripUuid: trip.id } });
      setUrl(result.url);
      setActive(true);
      try {
        await navigator.clipboard.writeText(result.url);
        toast.success(
          text(
            "Abonnementslink aangemaakt en gekopieerd.",
            "Subscription link created and copied.",
          ),
        );
      } catch {
        toast.success(
          text(
            "Abonnementslink aangemaakt. Kopieer de link hieronder.",
            "Subscription link created. Copy the link below.",
          ),
        );
      }
    } catch {
      toast.error(
        text("De agendalink kon niet worden gemaakt.", "The calendar link could not be created."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    setBusy(true);
    try {
      await revokeCalendarFeed({ data: { tripUuid: trip.id } });
      setActive(false);
      setUrl("");
      toast.success(text("Agendalink ingetrokken.", "Calendar link revoked."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={opened}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <CalendarDays className="size-4" /> {text("Agenda", "Calendar")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text("Reisagenda gebruiken", "Use trip calendar")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-xl border p-4">
            <p className="font-medium">{text("Eenmalige export", "One-time export")}</p>
            <p className="mb-3 text-sm text-muted-foreground">
              {text("Download de planning zoals die nu is.", "Download the schedule as it is now.")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                downloadTripCalendar(trip);
                toast.success(text("Reisagenda gedownload", "Trip calendar downloaded"));
              }}
            >
              <Download className="size-4" /> ICS
            </Button>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">
              {text("Live abonnement · Pro", "Live subscription · Pro")}
            </p>
            <p className="mb-3 text-sm text-muted-foreground">
              {text(
                "Je kalender haalt wijzigingen automatisch via een persoonlijke, alleen-lezen link op.",
                "Your calendar automatically retrieves updates through a personal read-only link.",
              )}
            </p>
            {!paid ? (
              <p className="text-sm text-muted-foreground">
                {text("Beschikbaar met Pro of Agency.", "Available with Pro or Agency.")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={busy} onClick={create}>
                  <RefreshCw className="size-4" />
                  {active
                    ? text("Nieuwe link maken", "Create new link")
                    : text("Link maken", "Create link")}
                </Button>
                {url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(url)}
                  >
                    <Copy className="size-4" />
                    {text("Kopiëren", "Copy")}
                  </Button>
                )}
                {active && (
                  <Button type="button" variant="ghost" disabled={busy} onClick={revoke}>
                    <Trash2 className="size-4" />
                    {text("Intrekken", "Revoke")}
                  </Button>
                )}
                {url && (
                  <input
                    aria-label={text("Persoonlijke agendalink", "Personal calendar link")}
                    className="w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm"
                    readOnly
                    value={url}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
