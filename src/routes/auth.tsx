import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Apple, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
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

const OAUTH_PROVIDERS = [
  { id: "apple", label: "Apple", icon: Apple },
  { id: "google", label: "Google", icon: KeyRound },
  { id: "azure", label: "Microsoft", icon: KeyRound },
] as const;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]["id"];

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider>();
  const [sent, setSent] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check je mail om je account te bevestigen.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welkom terug!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inloggen met deze provider lukte niet.");
      setOauthBusy(undefined);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {mode === "signin" ? "Inloggen" : "Account aanmaken"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Je reizen, uitgaven en bonnetjes worden versleuteld in je eigen workspace bewaard.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              We hebben een bevestigingsmail naar <strong>{email}</strong> gestuurd. Klik op de
              link om je workspace te activeren.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Naam</Label>
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
                <Label htmlFor="password">Wachtwoord</Label>
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
                {busy ? "Bezig…" : mode === "signin" ? "Inloggen" : "Account aanmaken"}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                of ga verder met
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {OAUTH_PROVIDERS.map((provider) => {
                  const Icon = provider.icon;
                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      disabled={busy || Boolean(oauthBusy)}
                      onClick={() => void signInWithOAuth(provider.id)}
                    >
                      <Icon className="size-4" />
                      {oauthBusy === provider.id ? "Even…" : provider.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setSent(false);
            }}
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin"
              ? "Nog geen account? Registreer gratis"
              : "Al een account? Log in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
