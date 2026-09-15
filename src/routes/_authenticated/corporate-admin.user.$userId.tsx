import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Route as RouteIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Metric } from "@/lib/corporate-admin-ui";
import {
  getPlatformUserDetail,
  resetPlatformUserMfa,
  setPlatformUserBlocked,
} from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/user/$userId")({
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const { text } = useLocale();
  const [reason, setReason] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);
  const [resettingMfa, setResettingMfa] = useState(false);
  const query = useQuery({
    queryKey: ["platform-user-detail", userId],
    queryFn: () => getPlatformUserDetail({ data: { userId } }),
  });
  const detail = query.data;
  const date = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(value),
        )
      : text("Niet beschikbaar", "Not available");
  const blocked = Boolean(
    detail?.user.blockedUntil && Date.parse(detail.user.blockedUntil) > Date.now(),
  );

  async function changeBlockState() {
    setSavingBlock(true);
    try {
      await setPlatformUserBlocked({ data: { userId, blocked: !blocked, reason } });
      setReason("");
      await query.refetch();
      toast.success(
        blocked
          ? text("Account hersteld.", "Account restored.")
          : text("Account tijdelijk geblokkeerd.", "Account temporarily blocked."),
      );
    } catch {
      toast.error(
        text(
          "De accountstatus kon niet worden gewijzigd.",
          "The account status could not be changed.",
        ),
      );
    } finally {
      setSavingBlock(false);
    }
  }

  async function resetMfa() {
    if (
      reason.trim().length < 10 ||
      !window.confirm(
        text(
          "Alle authenticatorcodes voor dit account verwijderen?",
          "Remove all authenticator codes for this account?",
        ),
      )
    )
      return;
    setResettingMfa(true);
    try {
      const result = await resetPlatformUserMfa({ data: { userId, reason } });
      setReason("");
      toast.success(
        text(
          `${result.removed} authenticator(s) verwijderd.`,
          `${result.removed} authenticator(s) removed.`,
        ),
      );
    } catch {
      toast.error(text("2FA kon niet worden hersteld.", "2FA could not be reset."));
    } finally {
      setResettingMfa(false);
    }
  }

  if (query.isLoading)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {text("Gebruikersgegevens laden…", "Loading user details…")}
        </CardContent>
      </Card>
    );
  if (query.isError || !detail)
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p>
            {text(
              "De gebruikersgegevens konden niet worden geladen.",
              "The user details could not be loaded.",
            )}
          </p>
          <Button asChild variant="outline">
            <Link to="/corporate-admin/users">
              {text("Terug naar gebruikers", "Back to users")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" className="-ml-3">
        <Link to="/corporate-admin/users">
          <ArrowLeft className="size-4" />
          {text("Terug naar gebruikers", "Back to users")}
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">
                {detail.user.displayName || text("Naamloos account", "Unnamed account")}
              </CardTitle>
              <p className="mt-1 break-all text-sm text-muted-foreground">{detail.user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{detail.workspace?.plan ?? "free"}</Badge>
              <Badge variant={detail.user.emailConfirmed ? "secondary" : "outline"}>
                {detail.user.emailConfirmed
                  ? text("Bevestigd", "Confirmed")
                  : text("Onbevestigd", "Unconfirmed")}
              </Badge>
              <Badge variant={blocked ? "destructive" : "secondary"}>
                {blocked ? text("Geblokkeerd", "Blocked") : text("Actief", "Active")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label={text("Account aangemaakt", "Account created")}
              value={date(detail.user.createdAt)}
            />
            <Info
              label={text("Laatste login", "Last sign-in")}
              value={date(detail.user.lastSignInAt)}
            />
            <Info
              label={text("Workspace aangemaakt", "Workspace created")}
              value={date(detail.workspace?.createdAt)}
            />
            <Info
              label={text("Laatste workspace-activiteit", "Latest workspace activity")}
              value={date(detail.workspace?.updatedAt)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="font-medium">
                {blocked
                  ? text("Accounttoegang herstellen", "Restore account access")
                  : text("Account tijdelijk blokkeren", "Temporarily block account")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {blocked
                  ? text(
                      "De gebruiker kan na herstel weer inloggen.",
                      "The user can sign in again after restoration.",
                    )
                  : text(
                      "De gebruiker kan niet meer inloggen totdat een beheerder het account herstelt.",
                      "The user cannot sign in until an administrator restores the account.",
                    )}
              </p>
            </div>
            <AlertDialog onOpenChange={(open) => !open && setReason("")}>
              <AlertDialogTrigger asChild>
                <Button variant={blocked ? "outline" : "destructive"}>
                  {blocked ? (
                    <ShieldCheck className="size-4" />
                  ) : (
                    <LockKeyhole className="size-4" />
                  )}
                  {blocked
                    ? text("Account herstellen", "Restore account")
                    : text("Account blokkeren", "Block account")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {blocked
                      ? text("Accounttoegang herstellen?", "Restore account access?")
                      : text("Account tijdelijk blokkeren?", "Temporarily block account?")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {blocked
                      ? text(
                          "Hiermee kan deze gebruiker direct weer inloggen. Geef een interne reden op; de actie wordt vastgelegd.",
                          "This immediately allows the user to sign in again. Provide an internal reason; the action is logged.",
                        )
                      : text(
                          "Hiermee verliest deze gebruiker direct de mogelijkheid om in te loggen. Reizen en gegevens blijven bewaard. Geef een interne reden op; de actie wordt vastgelegd.",
                          "This immediately prevents the user from signing in. Trips and data remain stored. Provide an internal reason; the action is logged.",
                        )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">
                    {text("Reden (verplicht)", "Reason (required)")}
                  </span>
                  <Input
                    value={reason}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={text("Minimaal 10 tekens", "At least 10 characters")}
                  />
                </label>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={savingBlock}>
                    {text("Annuleren", "Cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={
                      blocked
                        ? ""
                        : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    }
                    disabled={reason.trim().length < 10 || savingBlock}
                    onClick={(event) => {
                      void changeBlockState();
                    }}
                  >
                    {savingBlock
                      ? text("Bezig…", "Working…")
                      : blocked
                        ? text("Toegang herstellen", "Restore access")
                        : text("Account blokkeren", "Block account")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_20rem_auto] md:items-end">
          <div>
            <p className="font-medium">
              {text(
                "2FA-herstel na identiteitscontrole",
                "2FA recovery after identity verification",
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {text(
                "Vul een auditreden in en verwijder de TOTP-factor, zodat de gebruiker opnieuw kan instellen.",
                "Enter an audit reason and remove the TOTP factor so the user can enrol again.",
              )}
            </p>
          </div>
          <Input
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder={text("Reden, minimaal 10 tekens", "Reason, at least 10 characters")}
          />
          <Button
            variant="outline"
            disabled={resettingMfa || reason.trim().length < 10}
            onClick={() => void resetMfa()}
          >
            {text("2FA herstellen", "Reset 2FA")}
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={RouteIcon}
          label={text("Alle reizen", "All trips")}
          value={detail.tripCounts.total}
          detail={text("Eigen reizen", "Owned trips")}
        />
        <Metric
          icon={CalendarDays}
          label={text("Actief", "Active")}
          value={detail.tripCounts.active}
          detail={text("Niet gearchiveerd", "Not archived")}
        />
        <Metric
          icon={Globe2}
          label={text("Openbaar", "Public")}
          value={detail.tripCounts.public}
          detail={text("Actief en openbaar", "Active and public")}
        />
        <Metric
          icon={Archive}
          label={text("Gearchiveerd", "Archived")}
          value={detail.tripCounts.archived}
          detail={text("Eigen archief", "Owned archive")}
        />
        <Metric
          icon={Users}
          label={text("Gedeeld met gebruiker", "Shared with user")}
          value={detail.tripCounts.shared}
          detail={text("Actieve deelnames", "Active memberships")}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{text("Recent bijgewerkte reizen", "Recently updated trips")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {detail.recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text(
                "Deze gebruiker heeft nog geen eigen reizen.",
                "This user does not own any trips yet.",
              )}
            </p>
          ) : (
            detail.recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">{trip.name}</strong>
                  <span className="text-xs text-muted-foreground">
                    {trip.start || text("Geen startdatum", "No start date")} ·{" "}
                    {text("gewijzigd", "updated")} {date(trip.updatedAt)}
                  </span>
                </div>
                {trip.public && (
                  <Badge variant="secondary">
                    <ExternalLink className="mr-1 size-3" />
                    {text("Openbaar", "Public")}
                  </Badge>
                )}
                {trip.archived && (
                  <Badge variant="outline">{text("Gearchiveerd", "Archived")}</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
