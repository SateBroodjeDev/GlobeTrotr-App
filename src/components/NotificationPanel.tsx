import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/lib/locale";
import { respondToTripInvitation } from "@/lib/invitation.functions";

const styles = {
  account: {
    emoji: "👤",
    label: "Account",
    color:
      "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100",
  },
  trip_change: {
    emoji: "🧳",
    label: "Reiswijziging",
    color:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
  },
  invitation: {
    emoji: "✉️",
    label: "Uitnodiging",
    color:
      "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100",
  },
} as const;

export function NotificationPanel({ userId }: { userId: string }) {
  const { locale, text } = useLocale();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["notifications", userId];
  const notifications = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(50);
      if (error) throw error;
      return { items: data, count: count ?? data.length };
    },
    refetchInterval: 30_000,
    retry: 1,
  });
  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .single();
      if (error || !data)
        throw (
          error ??
          new Error(
            text("Melding kon niet worden verwijderd.", "Notification could not be dismissed."),
          )
        );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () =>
      toast.error(
        text(
          "Melding kon niet worden weggeklikt. Probeer het opnieuw.",
          "The notification could not be dismissed. Please try again.",
        ),
      ),
  });
  const respondInvitation = useMutation({
    mutationFn: async ({
      notificationId,
      invitationId,
      response,
    }: {
      notificationId: string;
      invitationId: string;
      response: "accept" | "decline";
    }) => {
      const result = await respondToTripInvitation({ data: { invitationId, response } });
      if (result.status !== "accepted" && result.status !== "declined")
        throw new Error(result.status);
      const { error } = await supabase
        .from("notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId);
      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(
        result.status === "accepted"
          ? text("Uitnodiging geaccepteerd.", "Invitation accepted.")
          : text("Uitnodiging geweigerd.", "Invitation declined."),
      );
      if (result.status === "accepted") window.location.assign("/dashboard");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("rpc-unavailable")
          ? text(
              "De uitnodigingsfunctie is nog niet beschikbaar in de database-API. Probeer het over een minuut opnieuw.",
              "The invitation function is not available in the database API yet. Try again in a minute.",
            )
          : message.includes("membership-conflict")
            ? text(
                "Dit account heeft al een conflicterende deelname. Open de uitnodigingslink voor meer informatie.",
                "This account already has a conflicting membership. Open the invitation link for more information.",
              )
            : text(
                "De uitnodiging kon niet worden verwerkt. Foutreferentie: invitation-response.",
                "The invitation could not be processed. Error reference: invitation-response.",
              ),
      );
    },
  });
  const count = notifications.data?.count ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${text("Meldingen", "Notifications")}${count ? `: ${count} ${text("openstaand", "open")}` : ""}`}
        >
          <Bell className="size-5" />
          {count > 0 && (
            <span
              className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
        aria-label={text("Meldingenpaneel", "Notifications panel")}
      >
        <div className="border-b p-4">
          <h2 className="font-semibold">
            {text("Meldingen", "Notifications")}
            {count > 0 ? ` (${count})` : ""}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {text(
              "Meldingen blijven staan totdat je ze met het kruisje wegklikt.",
              "Notifications remain here until you dismiss them.",
            )}
          </p>
        </div>
        <div
          className="max-h-[min(65dvh,32rem)] space-y-2 overflow-y-auto p-3"
          aria-busy={notifications.isPending}
        >
          {notifications.isPending && (
            <p role="status" className="p-3 text-sm text-muted-foreground">
              {text("Meldingen laden…", "Loading notifications…")}
            </p>
          )}
          {notifications.isError && (
            <div role="alert" className="space-y-2 p-3 text-sm">
              <p>
                {text(
                  "Meldingen zijn tijdelijk niet beschikbaar.",
                  "Notifications are temporarily unavailable.",
                )}
              </p>
              <Button size="sm" variant="outline" onClick={() => void notifications.refetch()}>
                {text("Opnieuw proberen", "Try again")}
              </Button>
            </div>
          )}
          {notifications.isSuccess && count === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              {text("Je hebt geen openstaande meldingen.", "You have no open notifications.")}
            </p>
          )}
          {notifications.data?.items.map((notification) => {
            const style = styles[notification.kind];
            const invitationId =
              notification.kind === "invitation" && notification.event_key.startsWith("invitation:")
                ? notification.event_key.slice("invitation:".length)
                : "";
            return (
              <article key={notification.id} className={`rounded-xl border p-3 ${style.color}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl" aria-hidden="true">
                    {style.emoji}
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <p className="text-xs font-medium">
                      {text(
                        style.label,
                        notification.kind === "account"
                          ? "Account"
                          : notification.kind === "trip_change"
                            ? "Trip change"
                            : "Invitation",
                      )}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{notification.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{notification.body}</p>
                    <time
                      dateTime={notification.created_at}
                      className="mt-2 block text-xs opacity-75"
                    >
                      {new Date(notification.created_at).toLocaleString(locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {notification.kind === "account" && (
                      <Link
                        to="/account"
                        className="mt-2 inline-block text-xs font-medium underline"
                        onClick={() => setOpen(false)}
                      >
                        {text("Naar account", "View account")}
                      </Link>
                    )}
                    {notification.kind === "trip_change" && notification.trip_uuid && (
                      <Link
                        to="/trips/$tripId"
                        params={{ tripId: notification.trip_uuid }}
                        className="mt-2 inline-block text-xs font-medium underline"
                        onClick={() => setOpen(false)}
                      >
                        {text("Bekijk reis", "View trip")}
                      </Link>
                    )}
                    {invitationId && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={respondInvitation.isPending}
                          onClick={() =>
                            respondInvitation.mutate({
                              notificationId: notification.id,
                              invitationId,
                              response: "accept",
                            })
                          }
                        >
                          <Check className="size-4" />
                          {text("Accepteren", "Accept")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={respondInvitation.isPending}
                          onClick={() =>
                            respondInvitation.mutate({
                              notificationId: notification.id,
                              invitationId,
                              response: "decline",
                            })
                          }
                        >
                          <X className="size-4" />
                          {text("Weigeren", "Decline")}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-inherit hover:bg-black/10 hover:text-inherit dark:hover:bg-white/10"
                    aria-label={`${text("Melding wegklikken", "Dismiss notification")}: ${notification.title}`}
                    disabled={dismiss.isPending}
                    onClick={() => dismiss.mutate(notification.id)}
                  >
                    {dismiss.isPending && dismiss.variables === notification.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
          {count > 50 && (
            <p className="p-2 text-xs text-muted-foreground">
              {text(
                "De nieuwste 50 meldingen worden getoond. Klik meldingen weg om oudere te zien.",
                "The latest 50 notifications are shown. Dismiss notifications to see older ones.",
              )}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
