import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      if (error || !data) throw error ?? new Error("Melding kon niet worden verwijderd.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Melding kon niet worden weggeklikt. Probeer het opnieuw."),
  });
  const count = notifications.data?.count ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Meldingen${count ? `: ${count} openstaand` : ""}`}
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
        aria-label="Meldingenpaneel"
      >
        <div className="border-b p-4">
          <h2 className="font-semibold">Meldingen{count > 0 ? ` (${count})` : ""}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Meldingen blijven staan totdat je ze met het kruisje wegklikt.
          </p>
        </div>
        <div
          className="max-h-[min(65dvh,32rem)] space-y-2 overflow-y-auto p-3"
          aria-busy={notifications.isPending}
        >
          {notifications.isPending && (
            <p role="status" className="p-3 text-sm text-muted-foreground">
              Meldingen laden…
            </p>
          )}
          {notifications.isError && (
            <div role="alert" className="space-y-2 p-3 text-sm">
              <p>Meldingen zijn tijdelijk niet beschikbaar.</p>
              <Button size="sm" variant="outline" onClick={() => void notifications.refetch()}>
                Opnieuw proberen
              </Button>
            </div>
          )}
          {notifications.isSuccess && count === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Je hebt geen openstaande meldingen.</p>
          )}
          {notifications.data?.items.map((notification) => {
            const style = styles[notification.kind];
            return (
              <article key={notification.id} className={`rounded-xl border p-3 ${style.color}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl" aria-hidden="true">
                    {style.emoji}
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <p className="text-xs font-medium">{style.label}</p>
                    <h3 className="mt-1 text-sm font-semibold">{notification.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{notification.body}</p>
                    <time
                      dateTime={notification.created_at}
                      className="mt-2 block text-xs opacity-75"
                    >
                      {new Date(notification.created_at).toLocaleString("nl-NL", {
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
                        Naar account
                      </Link>
                    )}
                    {notification.kind === "trip_change" && notification.trip_uuid && (
                      <Link
                        to="/trips/$tripId"
                        params={{ tripId: notification.trip_uuid }}
                        className="mt-2 inline-block text-xs font-medium underline"
                        onClick={() => setOpen(false)}
                      >
                        Bekijk reis
                      </Link>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-inherit hover:bg-black/10 hover:text-inherit dark:hover:bg-white/10"
                    aria-label={`Melding wegklikken: ${notification.title}`}
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
              De nieuwste 50 meldingen worden getoond. Klik meldingen weg om oudere te zien.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
