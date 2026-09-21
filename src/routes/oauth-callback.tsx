import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/oauth-callback")({ component: OAuthCallback });

function OAuthCallback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !/code verifier/i.test(error.message)) throw error;
        }
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        const user = refreshed.user;
        const next = params.get("next");
        const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
        if (!params.has("linked") && user) {
          const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
          const fresh = Date.now() - Date.parse(user.created_at) < 15 * 60_000;
          if (fresh && !profile?.onboarding_completed_at) {
            await navigate({ to: "/complete-profile", search: { next: safeNext }, replace: true });
            return;
          }
        }
        await navigate({ to: params.has("linked") ? "/account" : safeNext, replace: true });
      } catch {
        setFailed(true);
      }
    })();
  }, [navigate]);
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="text-center">
        {failed ? (
          <>
            <h1 className="font-display text-xl font-semibold">Koppelen mislukt</h1>
            <a className="mt-3 inline-block text-primary underline" href="/account">
              Terug naar account
            </a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-7 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Inlogmethode koppelen…</p>
          </>
        )}
      </div>
    </main>
  );
}
