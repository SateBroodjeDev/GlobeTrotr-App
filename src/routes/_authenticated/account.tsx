import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Clock3,
  CreditCard,
  KeyRound,
  Languages,
  Mail,
  Monitor,
  ShieldCheck,
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
      toast.error("Vul je naam in.");
      return;
    }
    const requestedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(requestedEmail)) {
      toast.error("Vul een geldig e-mailadres in.");
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
        toast.success("Profiel opgeslagen. Bevestig je nieuwe e-mailadres via je mail.");
      } else {
        toast.success("Accountinstellingen opgeslagen.");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opslaan lukte niet.");
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    if (!timezone.trim()) {
      toast.error("Kies een tijdzone.");
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] }),
      ]);
      toast.success("Weergavevoorkeuren opgeslagen.");
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
      toast.error("Gebruik een wachtwoord van minimaal 6 tekens.");
      return;
    }
    if (newPassword !== repeatPassword) {
      toast.error("De wachtwoorden komen niet overeen.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setRepeatPassword("");
      toast.success("Wachtwoord gewijzigd.");
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Accountinstellingen</h1>
        <p className="text-sm text-muted-foreground">
          Je persoonlijke profiel, inlogmethodes en abonnement.
        </p>
      </div>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserRound className="size-4" /> Profiel
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
                  <Camera className="size-4" /> Profielfoto wijzigen
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
              <Label htmlFor="account-name">Naam</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="account-phone">Telefoonnummer</Label>
              <Input
                id="account-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                placeholder="Optioneel"
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="account-email">E-mailadres</Label>
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bij een nieuw adres ontvang je eerst een bevestigingsmail. Tot die bevestiging
                blijft je huidige e-mailadres actief.
              </p>
            </label>
          </div>
          <Button disabled={saving || profileQuery.isLoading} onClick={saveProfile}>
            {saving ? "Opslaan…" : "Profiel en e-mailadres opslaan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Monitor className="size-4" /> Taal & weergave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <Label htmlFor="account-locale" className="flex items-center gap-2">
                <Languages className="size-4" /> Taal
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
                <Clock3 className="size-4" /> Tijdzone
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
              <Label htmlFor="account-theme">Weergave</Label>
              <select
                id="account-theme"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={theme}
                disabled={savingPreferences}
                onChange={(event) => setTheme(asThemePreference(event.target.value))}
              >
                <option value="system">Systeeminstelling volgen</option>
                <option value="light">Lichte modus</option>
                <option value="dark">Donkere modus</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            De taalkeuze wordt nu opgeslagen; de volledige Engelse vertaling volgt in een aparte
            productstap. Tijdzones worden daarna gebruikt voor boekingen, meldingen en exports.
          </p>
          <Button disabled={savingPreferences || profileQuery.isLoading} onClick={savePreferences}>
            {savingPreferences ? "Opslaan…" : "Voorkeuren opslaan"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="size-4" /> Inloggen & beveiliging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Inlogmethodes die aan dit account gekoppeld zijn.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span>E-mail en wachtwoord</span>
                <Badge variant="secondary">Gekoppeld</Badge>
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
                <p className="font-medium">Wachtwoord wijzigen</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gebruik minimaal 6 tekens en bewaar je wachtwoord veilig.
                </p>
              </div>
              <label className="space-y-1.5">
                <Label htmlFor="new-password">Nieuw wachtwoord</Label>
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
                <Label htmlFor="repeat-password">Herhaal nieuw wachtwoord</Label>
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
                {savingPassword ? "Wachtwoord opslaan…" : "Nieuw wachtwoord opslaan"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4" /> Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cloud === "loading" ? (
              <p className="text-muted-foreground" role="status">
                Abonnement laden…
              </p>
            ) : (
              <>
                <p>
                  Huidig plan: <Badge variant="secondary">{plan.name}</Badge>
                </p>
                <dl className="space-y-1">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted-foreground">Reizen in je account</dt>
                    <dd>
                      {state.trips.length} /{" "}
                      {Number.isFinite(plan.tripLimit) ? plan.tripLimit : "onbeperkt"}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted-foreground">Actieve reizen</dt>
                    <dd>{activeTripCount}</dd>
                  </div>
                </dl>
                <p className="text-muted-foreground">
                  Vergelijk plannen en beheer je abonnement op de abonnementspagina.
                </p>
              </>
            )}
            <Button asChild variant="outline">
              <Link to="/billing">
                {state.plan === "free" ? "Bekijk upgrades" : "Abonnement beheren"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="size-4" /> Communicatie
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Meldingsvoorkeuren voor uitnodigingen, betalingen en vluchtalerts komen hier zodra de
          e-mailfunctie is geactiveerd.
        </CardContent>
      </Card>
      <Card className="border-destructive/40 surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" /> Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Account verwijderen en gegevens exporteren worden toegevoegd nadat de SQL-migratie en
          documentopslag zijn afgerond.
        </CardContent>
      </Card>
    </div>
  );
}

function providerLabel(provider: string) {
  return OAUTH_PROVIDERS.find((option) => option.id === provider)?.label ?? provider;
}
