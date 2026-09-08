import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Clock3,
  CreditCard,
  Download,
  KeyRound,
  Languages,
  Mail,
  Monitor,
  ShieldCheck,
  Trash2,
  Unlink,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { planOf } from "@/lib/plans";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/locale";
import { deleteAccount, exportAccountData } from "@/lib/account.functions";
import { openPrivacyChoices } from "@/lib/privacy-consent";
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

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Accountinstellingen — GlobeTrotr" }] }),
  component: AccountPage,
});

type Profile = {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_path: string | null;
  locale: string | null;
  theme: string | null;
  timezone: string | null;
};

type ThemePreference = "system" | "light" | "dark";
const OAUTH_PROVIDERS = [
  { id: "apple", label: "Apple" },
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
] as const;

const LANGUAGES = [
  { value: "nl-NL", label: "Nederlands" },
  { value: "en-GB", label: "English" },
] as const;

const TIMEZONES = [
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
] as const;

function asThemePreference(value: string | null | undefined): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

function AccountPage() {
  const { user } = useAuth();
  const { state, cloud } = useWorkspace();
  const { setLocale: applyLocale, text } = useLocale();
  const plan = planOf(state.plan);
  const activeTripCount = state.trips.filter((trip) => !trip.archived).length;
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, phone, avatar_path, locale, theme, timezone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
  const profile = profileQuery.data;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState("nl-NL");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [oauthAction, setOauthAction] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(profile?.display_name ?? String(user.user_metadata.full_name ?? ""));
    setEmail(user.email ?? profile?.email ?? "");
    setPhone(profile?.phone ?? String(user.user_metadata.phone ?? ""));
    setLocale(profile?.locale === "en-GB" ? "en-GB" : "nl-NL");
    setTimezone(profile?.timezone || "Europe/Amsterdam");
    setTheme(asThemePreference(profile?.theme));
  }, [profile, user]);

  useEffect(() => {
    if (!profile?.avatar_path) {
      setAvatarUrl(undefined);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60)
      .then(({ data }) => setAvatarUrl(data?.signedUrl));
  }, [profile?.avatar_path]);

  if (!user) return null;
  const initials = (name || email || "G")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const identities = user.identities ?? [];

  async function saveProfile() {
    if (!name.trim()) {
      toast.error(text("Vul je naam in.", "Enter your name."));
      return;
    }
    const requestedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(requestedEmail)) {
      toast.error(text("Vul een geldig e-mailadres in.", "Enter a valid email address."));
      return;
    }
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        // Auth blijft de bron van waarheid voor een e-mailadres. Een nieuw
        // adres wordt daar pas actief nadat de gebruiker het heeft bevestigd.
        email: user.email ?? null,
        phone: phone.trim() || null,
      });
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: name.trim(), phone: phone.trim() || undefined },
      });
      if (metadataError) throw metadataError;

      if (requestedEmail !== (user.email ?? "").toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: requestedEmail });
        if (emailError) throw emailError;
        toast.success(text("Profiel opgeslagen. Bevestig je nieuwe e-mailadres via je mail.", "Profile saved. Confirm your new email address by email."));
      } else {
        toast.success(text("Accountinstellingen opgeslagen.", "Account settings saved."));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Opslaan lukte niet.", "Saving failed."));
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    if (!timezone.trim()) {
      toast.error(text("Kies een tijdzone.", "Choose a time zone."));
      return;
    }
    setSavingPreferences(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        locale,
        timezone,
        theme,
      });
      if (error) throw error;
      await applyLocale(locale === "en-GB" ? "en-GB" : "nl-NL");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] }),
      ]);
      toast.success(text("Weergavevoorkeuren opgeslagen.", "Display preferences saved."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Voorkeuren opslaan lukte niet. Voer eerst de tijdzone-migratie uit.",
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error("Kies een JPG, PNG of WebP tot 5 MB.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const avatarPath = `${user.id}/avatar.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_path: avatarPath });
      if (profileError) throw profileError;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] }),
      ]);
      toast.success("Profielfoto opgeslagen.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Uploaden lukte niet. Voer eerst de SQL-migratie uit.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function savePassword() {
    if (newPassword.length < 6) {
      toast.error(text("Gebruik een wachtwoord van minimaal 6 tekens.", "Use a password of at least 6 characters."));
      return;
    }
    if (newPassword !== repeatPassword) {
      toast.error(text("De wachtwoorden komen niet overeen.", "The passwords do not match."));
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setRepeatPassword("");
      toast.success(text("Wachtwoord gewijzigd.", "Password changed."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Wachtwoord kon niet worden gewijzigd. Log opnieuw in en probeer het nogmaals.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function unlinkOAuth(identity: (typeof identities)[number]) {
    if (identities.length <= 1) {
      toast.error("Je kunt niet je laatste inlogmethode verwijderen.");
      return;
    }
    if (
      !window.confirm(`Weet je zeker dat je ${providerLabel(identity.provider)} wilt ontkoppelen?`)
    ) {
      return;
    }
    setOauthAction(`unlink-${identity.identity_id}`);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      toast.success("Inlogmethode ontkoppeld.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider ontkoppelen lukte niet.");
    } finally {
      setOauthAction(undefined);
    }
  }

  async function downloadAccountExport() {
    setExporting(true);
    try {
      const exported = await exportAccountData();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `globetrotr-account-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(text("Je gegevensexport is gedownload.", "Your data export has been downloaded."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Exporteren is mislukt.", "Export failed."));
    } finally {
      setExporting(false);
    }
  }

  async function removeAccount() {
    if (deleteConfirmation !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount({ data: { confirmation: deleteConfirmation } });
      localStorage.removeItem(`globetrotr.workspace.v1.${user.id}`);
      localStorage.removeItem(`atlasledger.workspace.v1.${user.id}`);
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Account verwijderen is mislukt.", "Account deletion failed."));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{text("Accountinstellingen", "Account settings")}</h1>
        <p className="text-sm text-muted-foreground">
          {text("Je persoonlijke profiel, inlogmethodes en abonnement.", "Your personal profile, sign-in methods and plan.")}
        </p>
      </div>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserRound className="size-4" /> {text("Profiel", "Profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <label>
              <Button type="button" variant="outline" asChild>
                <span>
                  <Camera className="size-4" /> {text("Profielfoto wijzigen", "Change profile picture")}
                </span>
              </Button>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadAvatar}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <Label htmlFor="account-name">{text("Naam", "Name")}</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="account-phone">{text("Telefoonnummer", "Phone number")}</Label>
              <Input
                id="account-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                placeholder={text("Optioneel", "Optional")}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="account-email">{text("E-mailadres", "Email address")}</Label>
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {text("Bij een nieuw adres ontvang je eerst een bevestigingsmail. Tot die bevestiging blijft je huidige e-mailadres actief.", "A new address must be confirmed by email. Your current email address remains active until then.")}
              </p>
            </label>
          </div>
          <Button disabled={saving || profileQuery.isLoading} onClick={saveProfile}>
            {saving ? text("Opslaan…", "Saving…") : text("Profiel en e-mailadres opslaan", "Save profile and email address")}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Monitor className="size-4" /> {text("Taal & weergave", "Language & appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <Label htmlFor="account-locale" className="flex items-center gap-2">
                <Languages className="size-4" /> {text("Taal", "Language")}
              </Label>
              <select
                id="account-locale"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={locale}
                disabled={savingPreferences}
                onChange={(event) => setLocale(event.target.value)}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="account-timezone" className="flex items-center gap-2">
                <Clock3 className="size-4" /> {text("Tijdzone", "Time zone")}
              </Label>
              <select
                id="account-timezone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={timezone}
                disabled={savingPreferences}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {!TIMEZONES.some((option) => option.value === timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {TIMEZONES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="account-theme">{text("Weergave", "Appearance")}</Label>
              <select
                id="account-theme"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={theme}
                disabled={savingPreferences}
                onChange={(event) => setTheme(asThemePreference(event.target.value))}
              >
                <option value="system">{text("Systeeminstelling volgen", "Use system setting")}</option>
                <option value="light">{text("Lichte modus", "Light mode")}</option>
                <option value="dark">{text("Donkere modus", "Dark mode")}</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {text("Je taal, tijdzone en weergave worden voor dit account opgeslagen.", "Your language, time zone and appearance are saved for this account.")}
          </p>
          <Button disabled={savingPreferences || profileQuery.isLoading} onClick={savePreferences}>
            {savingPreferences ? text("Opslaan…", "Saving…") : text("Voorkeuren opslaan", "Save preferences")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="size-4" /> {text("Inloggen & beveiliging", "Sign-in & security")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {text("Inlogmethodes die aan dit account gekoppeld zijn.", "Sign-in methods linked to this account.")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span>{text("E-mail en wachtwoord", "Email and password")}</span>
                <Badge variant="secondary">{text("Gekoppeld", "Linked")}</Badge>
              </div>
              {identities
                .filter((identity) =>
                  OAUTH_PROVIDERS.some((provider) => provider.id === identity.provider),
                )
                .map((identity) => (
                  <div
                    key={identity.identity_id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <span>{providerLabel(identity.provider)}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">Gekoppeld</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={identities.length <= 1 || Boolean(oauthAction)}
                        title={`${providerLabel(identity.provider)} ontkoppelen`}
                        onClick={() => void unlinkOAuth(identity)}
                      >
                        <Unlink className="size-4" />
                      </Button>
                    </span>
                  </div>
                ))}
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <p className="font-medium">{text("Wachtwoord wijzigen", "Change password")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {text("Gebruik minimaal 6 tekens en bewaar je wachtwoord veilig.", "Use at least 6 characters and store your password securely.")}
                </p>
              </div>
              <label className="space-y-1.5">
                <Label htmlFor="new-password">{text("Nieuw wachtwoord", "New password")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <Label htmlFor="repeat-password">{text("Herhaal nieuw wachtwoord", "Repeat new password")}</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                />
              </label>
              <Button
                type="button"
                className="mt-2 w-full sm:w-auto"
                disabled={savingPassword || !newPassword || !repeatPassword}
                onClick={() => void savePassword()}
              >
                <KeyRound className="size-4" />
                {savingPassword ? text("Wachtwoord opslaan…", "Saving password…") : text("Nieuw wachtwoord opslaan", "Save new password")}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4" /> {text("Abonnement", "Plan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cloud === "loading" ? (
              <p className="text-muted-foreground" role="status">
                {text("Abonnement laden…", "Loading plan…")}
              </p>
            ) : (
              <>
                <p>
                  {text("Huidig plan", "Current plan")}: <Badge variant="secondary">{plan.name}</Badge>
                </p>
                <dl className="space-y-1">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted-foreground">{text("Reizen in je account", "Trips in your account")}</dt>
                    <dd>
                      {state.trips.length} /{" "}
                      {Number.isFinite(plan.tripLimit) ? plan.tripLimit : text("onbeperkt", "unlimited")}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted-foreground">{text("Actieve reizen", "Active trips")}</dt>
                    <dd>{activeTripCount}</dd>
                  </div>
                </dl>
                <p className="text-muted-foreground">
                  {text("Vergelijk plannen en beheer je abonnement op de abonnementspagina.", "Compare plans and manage your subscription on the plan page.")}
                </p>
              </>
            )}
            <Button asChild variant="outline">
              <Link to="/billing">
                {state.plan === "free" ? text("Bekijk upgrades", "View upgrades") : text("Abonnement beheren", "Manage plan")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="size-4" /> {text("Communicatie", "Communication")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {text("Meldingsvoorkeuren voor uitnodigingen, betalingen en vluchtalerts komen hier zodra de e-mailfunctie is geactiveerd.", "Notification preferences for invitations, payments and flight alerts will appear here once email is enabled.")}
        </CardContent>
      </Card>
      <Card className="border-destructive/40 surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" /> Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">{text("Browseropslag beheren", "Manage browser storage")}</p><p className="mt-1 text-xs text-muted-foreground">{text("Bekijk noodzakelijke opslag en bepaal of je taalkeuze op dit apparaat wordt onthouden.", "Review necessary storage and choose whether your language is remembered on this device.")}</p></div>
            <Button type="button" variant="outline" className="shrink-0" onClick={openPrivacyChoices}>{text("Privacykeuzes", "Privacy choices")}</Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{text("Download je gegevens", "Download your data")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {text("Ontvang een machineleesbaar JSON-bestand met je account, profiel, reizen, planning, uitgaven en samenwerkingen. Geüploade bestanden worden als metadata vermeld.", "Receive a machine-readable JSON file with your account, profile, trips, itinerary, expenses and collaborations. Uploaded files are listed as metadata.")}
              </p>
            </div>
            <Button type="button" variant="outline" className="shrink-0" disabled={exporting} onClick={() => void downloadAccountExport()}>
              <Download className="size-4" /> {exporting ? text("Export maken…", "Creating export…") : text("Gegevens exporteren", "Export data")}
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">{text("Account definitief verwijderen", "Permanently delete account")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {text("Je profiel, eigen reizen, uitgaven, meldingen en uploads worden verwijderd. Dit kan niet ongedaan worden gemaakt.", "Your profile, owned trips, expenses, notifications and uploads will be deleted. This cannot be undone.")}
              </p>
            </div>
            <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmation("")}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="shrink-0"><Trash2 className="size-4" /> {text("Account verwijderen", "Delete account")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>{text("Weet je het zeker?", "Are you sure?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {text("Download desgewenst eerst je gegevens. Typ DELETE om je account en alle eigen reisgegevens definitief te verwijderen.", "Download your data first if you wish. Type DELETE to permanently remove your account and all trips you own.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input aria-label={text("Bevestiging", "Confirmation")} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" />
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>{text("Annuleren", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteConfirmation !== "DELETE" || deleting} onClick={(event) => { event.preventDefault(); void removeAccount(); }}>
                    {deleting ? text("Verwijderen…", "Deleting…") : text("Definitief verwijderen", "Delete permanently")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function providerLabel(provider: string) {
  return OAUTH_PROVIDERS.find((option) => option.id === provider)?.label ?? provider;
}
