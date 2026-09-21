import { useState } from "react";
import { CalendarDays, Copy, Download, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
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
  const { text, locale } = useLocale();
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(false),
    [createdAt, setCreatedAt] = useState<string | null>(null),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  async function opened(value: boolean) {
    setOpen(value);
    if (value && paid) {
      try {
        const status = await getCalendarFeedStatus({ data: { tripUuid: trip.id } });
        setActive(Boolean(status));
        setCreatedAt(status?.created_at ?? null);
      } catch {
        setActive(false);
        setCreatedAt(null);
      }
    }
  }
  async function create() {
    setBusy(true);
    try {
      const result = await createCalendarFeed({ data: { tripUuid: trip.id } });
      setUrl(result.url);
      setActive(true);
      setCreatedAt(new Date().toISOString());
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
    } catch (error) {
      toast.error(error instanceof Error && error.message.includes("CALENDAR_FEED_ENDPOINT_UNAVAILABLE")
        ? text("De live agenda is momenteel niet bereikbaar. Je bestaande link blijft actief; probeer het later opnieuw.", "The live calendar is currently unavailable. Your existing link remains active; try again later.")
        : text("De agendalink kon niet worden gemaakt.", "The calendar link could not be created."));
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    setBusy(true);
    try {
      await revokeCalendarFeed({ data: { tripUuid: trip.id } });
      setActive(false);
      setCreatedAt(null);
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
            {active && createdAt && (
              <p className="mb-3 text-xs text-muted-foreground">
                {text("Actieve link gemaakt op", "Active link created on")} {new Date(createdAt).toLocaleString(locale)}. {url
                  ? text("Bewaar deze persoonlijke URL veilig.", "Store this personal URL securely.")
                  : text(
                      "De geheime URL wordt niet opnieuw getoond. Maak alleen een nieuwe link als je de oude niet meer hebt.",
                      "The secret URL is not shown again. Create a new link only if you no longer have the old one.",
                    )}
              </p>
            )}
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
                    onClick={() => window.location.assign(url.replace(/^https:/, "webcal:"))}
                  >
                    <ExternalLink className="size-4" />
                    {text("Open in agenda-app", "Open in calendar app")}
                  </Button>
                )}
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
