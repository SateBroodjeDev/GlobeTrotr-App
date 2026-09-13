import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";
import { getPublicFeatureFlags } from "@/lib/corporate-governance.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
      ? search.redirect.slice(0, 500)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Inloggen — GlobeTrotr workspace" },
      {
        name: "description",
        content:
          "Log in of maak een gratis account om je reizen, budgetten en bonnetjes in de cloud te bewaren.",
      },
      { property: "og:title", content: "Inloggen — GlobeTrotr workspace" },
      {
        property: "og:description",
        content: "Bewaar je reisplanning en uitgaven veilig in je eigen cloud-workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { session } = useAuth();
  const { redirect } = Route.useSearch();
  const { text } = useLocale();
  const navigate = useNavigate();
  const flags = useQuery({ queryKey: ["public-feature-flags"], queryFn: () => getPublicFeatureFlags(), retry: false });
  const registrationEnabled = flags.data?.["public.registration"] !== false;

  useEffect(() => {
    if (!registrationEnabled && mode === "signup") setMode("signin");
  }, [registrationEnabled, mode]);

  useEffect(() => {
    if (!session) return;
    if (redirect) window.location.replace(redirect);
    else navigate({ to: "/dashboard", replace: true });
  }, [session, navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirect ?? ""}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success(
            text(
              "Check je mail om je account te bevestigen.",
              "Check your email to confirm your account.",
            ),
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(text("Welkom terug!", "Welcome back!"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        /user is banned/i.test(message)
          ? text(
              "Dit account is tijdelijk geblokkeerd. Neem contact op via info@globetrotr.nl als je denkt dat dit niet klopt.",
              "This account is temporarily blocked. Contact info@globetrotr.nl if you believe this is incorrect.",
            )
          : message || text("Er ging iets mis", "Something went wrong"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {mode === "signin"
              ? text("Inloggen", "Sign in")
              : text("Account aanmaken", "Create account")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {text(
              "Je reizen, uitgaven en bonnetjes worden veilig in je eigen workspace bewaard.",
              "Your trips, expenses and receipts are stored securely in your own workspace.",
            )}
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              {text(
                "We hebben een bevestigingsmail gestuurd naar",
                "We sent a confirmation email to",
              )}{" "}
              <strong>{email}</strong>.{" "}
              {text(
                redirect
                  ? "Klik op de link om je account te bevestigen. Daarna kom je terug bij de uitnodiging."
                  : "Klik op de link om je workspace te activeren.",
                redirect
                  ? "Follow the link to confirm your account. You will then return to the invitation."
                  : "Follow the link to activate your workspace.",
              )}
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{text("Naam", "Name")}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{text("Wachtwoord", "Password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? text("Bezig…", "Working…")
                  : mode === "signin"
                    ? text("Inloggen", "Sign in")
                    : text("Account aanmaken", "Create account")}
              </Button>
            </form>
          )}

          {registrationEnabled ? <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setSent(false);
            }}
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin"
              ? text("Nog geen account? Registreer gratis", "No account yet? Create one for free")
              : text("Al een account? Log in", "Already have an account? Sign in")}
          </button> : <p className="mt-4 text-center text-sm text-muted-foreground">{text("Nieuwe registraties zijn tijdelijk gepauzeerd. Bestaande gebruikers kunnen gewoon inloggen.","New registrations are temporarily paused. Existing users can still sign in.")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
