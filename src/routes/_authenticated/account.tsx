import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CreditCard, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
};

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, phone, avatar_path")
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
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(profile?.display_name ?? String(user.user_metadata.full_name ?? ""));
    setEmail(profile?.email ?? user.email ?? "");
    setPhone(profile?.phone ?? String(user.user_metadata.phone ?? ""));
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
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: name.trim(), phone: phone.trim() || undefined },
      });
      if (metadataError) throw metadataError;

      if (email.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) throw emailError;
        toast.success("Profiel opgeslagen. Bevestig je nieuwe e-mailadres via je mail.");
      } else {
        toast.success("Accountinstellingen opgeslagen.");
      }
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opslaan lukte niet.");
    } finally {
      setSaving(false);
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
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
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
            </label>
          </div>
          <Button disabled={saving || profileQuery.isLoading} onClick={saveProfile}>
            {saving ? "Opslaan…" : "Profiel opslaan"}
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
            {identities.length ? (
              identities.map((identity) => (
                <div
                  key={identity.identity_id}
                  className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
                >
                  <span className="capitalize">{identity.provider}</span>
                  <Badge variant="secondary">Gekoppeld</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">E-mail en wachtwoord</p>
            )}
            <p className="text-xs text-muted-foreground">
              OAuth toevoegen of loskoppelen verschijnt hier zodra de provider in Supabase is
              geconfigureerd.
            </p>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4" /> Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Beheer plan, facturen en betaalgegevens apart van je persoonlijke profiel.
            </p>
            <Button asChild variant="outline">
              <Link to="/billing">Naar abonnement</Link>
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
