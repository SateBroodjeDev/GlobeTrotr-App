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
import { respondToAgencyInvitation } from "@/lib/agency.functions";

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
  membership: {
    emoji: "👋",
    label: "Reisdeelname",
    color: "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-100",
  },
  feedback: {
    emoji: "💬",
    label: "Feedback",
    color: "border-cyan-300 bg-cyan-50 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100",
  },
  platform: {
    emoji: "📣",
    label: "GlobeTrotr",
    color: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
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
      agency,
    }: {
      notificationId: string;
      invitationId: string;
      response: "accept" | "decline";
      agency?: boolean;
    }) => {
      const result = agency
        ? await respondToAgencyInvitation({ data: { invitationId, response } })
        : await respondToTripInvitation({ data: { invitationId, response } });
      if (!["accepted", "already_member", "declined"].includes(result.status))
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
        result.status === "declined"
          ? text("Uitnodiging geweigerd.", "Invitation declined.")
          : result.status === "already_member"
            ? text("Je neemt al deel aan deze reis.", "You already participate in this trip.")
            : text("Uitnodiging geaccepteerd.", "Invitation accepted."),
      );
      if (result.status !== "declined") window.location.assign("/dashboard");
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
            const responseMatch = notification.event_key.match(
              /^invitation-response:(accepted|declined):/,
            );
            const responseParts = responseMatch ? notification.body.split("|") : [];
            const responseAccepted = responseMatch?.[1] === "accepted";
            const feedbackParts = notification.kind === "feedback" ? notification.body.split("|") : [];
            const platformParts = notification.kind === "platform" ? notification.body.split("|") : [];
            const feedbackStatus = ({ reviewing: text("Wordt bekeken", "Under review"), planned: text("Gepland", "Planned"), resolved: text("Opgelost", "Resolved"), closed: text("Gesloten", "Closed"), new: text("Ontvangen", "Received") } as Record<string,string>)[feedbackParts[0] ?? ""];
            const notificationTitle = notification.kind === "platform"
              ? locale.startsWith("nl") ? notification.title : platformParts[2] || notification.title
              : notification.kind === "feedback"
                ? text("Feedback bijgewerkt", "Feedback updated")
                : notification.kind === "membership"
                  ? text("Uit reis verwijderd", "Removed from trip")
              : responseMatch
              ? responseAccepted
                ? text("Uitnodiging geaccepteerd", "Invitation accepted")
                : text("Uitnodiging geweigerd", "Invitation declined")
              : notification.title;
            const notificationBody = notification.kind === "platform"
              ? locale.startsWith("nl") ? platformParts[3] || notification.body : platformParts[4] || notification.body
              : notification.kind === "feedback"
                ? text(`Status: ${feedbackStatus}. ${feedbackParts.slice(1).join("|")}`, `Status: ${feedbackStatus}. ${feedbackParts.slice(1).join("|")}`)
                : notification.kind === "membership"
                  ? text(`Je bent verwijderd uit ${notification.body}.`, `You have been removed from ${notification.body}.`)
              : responseMatch
              ? responseAccepted
                ? text(
                    `${responseParts[0]} neemt nu deel aan ${responseParts.slice(1).join("|")}.`,
                    `${responseParts[0]} has joined ${responseParts.slice(1).join("|")}.`,
                  )
                : text(
                    `${responseParts[0]} heeft de uitnodiging voor ${responseParts.slice(1).join("|")} geweigerd.`,
                    `${responseParts[0]} declined the invitation for ${responseParts.slice(1).join("|")}.`,
                  )
              : notification.body;
            const invitationId =
              notification.kind === "invitation" && notification.event_key.startsWith("invitation:")
                ? notification.event_key.slice("invitation:".length)
                : "";
            const agencyInvitationId =
              notification.kind === "invitation" && notification.event_key.startsWith("workspace-invitation:")
                ? notification.event_key.slice("workspace-invitation:".length)
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
                            : notification.kind === "invitation"
                              ? "Invitation"
                              : notification.kind === "membership"
                                ? "Trip membership"
                                : notification.kind === "feedback"
                                  ? "Feedback"
                                  : "GlobeTrotr",
                      )}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{notificationTitle}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{notificationBody}</p>
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
                    {responseMatch && notification.trip_uuid && (
                      <Link
                        to="/trips/$tripId"
                        params={{ tripId: notification.trip_uuid }}
                        className="mt-2 inline-block text-xs font-medium underline"
                        onClick={() => setOpen(false)}
                      >
                        {text("Bekijk reisgenoten", "View travellers")}
                      </Link>
                    )}
                    {(invitationId || agencyInvitationId) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={respondInvitation.isPending}
                          onClick={() =>
                            respondInvitation.mutate({
                              notificationId: notification.id,
                              invitationId: invitationId || agencyInvitationId,
                              response: "accept",
                              agency: Boolean(agencyInvitationId),
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
                              invitationId: invitationId || agencyInvitationId,
                              response: "decline",
                              agency: Boolean(agencyInvitationId),
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
