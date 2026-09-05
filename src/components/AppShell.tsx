import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  CreditCard,
  Globe2,
  Map,
  LogIn,
  LogOut,
  Palette,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { planOf } from "@/lib/plans";
import { ROLES } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/", label: "Reizen", icon: Map },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/team", label: "Team & rollen", icon: Users },
  { to: "/branding", label: "White-label", icon: Palette },
  { to: "/billing", label: "Abonnement", icon: CreditCard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, update, cloud } = useWorkspace();
  const plan = planOf(state.plan);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-hue", String(state.branding.accent));
  }, [state.branding.accent]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoIcon.url}
              alt={`${state.branding.brandName} logo`}
              className="size-9 rounded-xl"
            />
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold">
                {state.branding.brandName}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {state.branding.domain}
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Globe2 className="size-3" /> {plan.name}
            </Badge>
            {user ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden max-w-[9rem] truncate text-xs text-muted-foreground sm:block"
                  title={user.email ?? ""}
                >
                  {cloud === "saving" ? "Opslaan…" : cloud === "loading" ? "Laden…" : user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="size-4" /> Uitloggen
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">
                  <LogIn className="size-4" /> Inloggen
                </Link>
              </Button>
            )}
            <select
              aria-label="Actieve rol"
              value={state.role}
              onChange={(e) =>
                update((s) => ({ ...s, role: e.target.value as typeof s.role }))
              }
              className="rounded-lg border border-input bg-card px-2 py-1.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        {state.branding.brandName} — {state.branding.tagline} · Kaartdata © OpenStreetMap ·
        Weer via Open-Meteo · Koersen via Frankfurter/ECB
      </footer>
    </div>
  );
}
