import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { safeInternalRedirect } from "@/lib/safe-redirect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/complete-profile")({
  validateSearch: (search: Record<string, unknown>) => ({ next: safeInternalRedirect(search.next) || "/dashboard" }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const { user, loading } = useAuth();
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { text } = useLocale();
  const [name, setName] = useState(String(user?.user_metadata?.full_name || ""));
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (!user) return;
    if (!name.trim()) { toast.error(text("Vul je naam in.", "Enter your name.")); return; }
    setBusy(true);
    try {
      let avatarPath: string | undefined;
      if (photo) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 5 * 1024 * 1024) throw new Error(text("Kies een JPG, PNG of WebP tot 5 MB.", "Choose a JPG, PNG or WebP under 5 MB."));
        const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        avatarPath = `${user.id}/avatar.${extension}`;
        const { error } = await supabase.storage.from("avatars").upload(avatarPath, photo, { upsert: true });
        if (error) throw error;
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        email: user.email,
        phone: phone.trim() || null,
        ...(avatarPath ? { avatar_path: avatarPath } : {}),
        onboarding_completed_at: new Date().toISOString(),
      });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: name.trim(), phone: phone.trim() || null } });
      window.location.assign(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Opslaan is mislukt.", "Could not save your profile."));
    } finally { setBusy(false); }
  }

  if (loading) return null;
  if (!user) { void navigate({ to: "/auth", replace: true }); return null; }
  return <main className="mx-auto max-w-xl px-4 py-12">
    <Card><CardHeader><CardTitle>{text("Maak je profiel compleet", "Complete your profile")}</CardTitle><p className="text-sm text-muted-foreground">{text("Welkom bij GlobeTrotr. Vul je gegevens aan zodat reisgenoten je herkennen. Telefoon en foto zijn optioneel.", "Welcome to GlobeTrotr. Add your details so travel companions recognise you. Phone and photo are optional.")}</p></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="profile-name">{text("Naam", "Name")}</Label><Input id="profile-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-phone">{text("Telefoonnummer (optioneel)", "Phone number (optional)")}</Label><Input id="profile-phone" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-photo">{text("Profielfoto (optioneel)", "Profile photo (optional)")}</Label><Input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] || null)} /></div>
        <Button disabled={busy} onClick={() => void finish()}>{busy ? text("Opslaan…", "Saving…") : text("Opslaan en verder", "Save and continue")}</Button>
      </CardContent></Card>
  </main>;
}
