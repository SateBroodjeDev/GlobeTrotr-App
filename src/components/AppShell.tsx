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
  UserRound,
  Users,
} from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace";
import { planOf } from "@/lib/plans";
import { ROLES } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logoIcon from "@/assets/logo-icon.asset.json";

const CORE_NAV = [{ to: "/dashboard", label: "Reizen", icon: Map }] as const;

const AGENCY_NAV = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/team", label: "Team & rollen", icon: Users },
  { to: "/branding", label: "White-label", icon: Palette },
] as const;

const PUBLIC_NAV = [{ to: "/", label: "Home", icon: Map }] as const;
type ThemePreference = "system" | "light" | "dark";

function asThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShellContent>{children}</AppShellContent>
    </WorkspaceProvider>
  );
}

// Keep the provider and its consumer in the same module. This also prevents a
// partial Vite/Lovable hot reload from rendering the shell with a stale context.
function AppShellContent({ children }: { children: ReactNode }) {
  const { state, update, cloud } = useWorkspace();
  const plan = planOf(state.plan);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const themeQuery = useQuery({
    queryKey: ["profile-theme", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return asThemePreference(data?.theme);
    },
  });
  const theme = user ? (themeQuery.data ?? "system") : "system";
  const navItems = user
    ? [
        ...CORE_NAV,
        ...(state.plan === "agency" ? AGENCY_NAV : []),
        { to: "/account", label: "Account", icon: UserRound },
        { to: "/billing", label: "Abonnement", icon: CreditCard },
      ]
    : PUBLIC_NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-hue", String(state.branding.accent));
  }, [state.branding.accent]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };
    applyTheme();
    if (theme !== "system") return;
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

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
            {navItems.map((item) => (
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
            {user && (
              <Badge variant="secondary" className="gap-1">
                <Globe2 className="size-3" /> {plan.name}
              </Badge>
            )}
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
                  <LogIn className="size-4" /> Inloggen / registreren
                </Link>
              </Button>
            )}
            {user && (
              <select
                aria-label="Actieve rol"
                value={state.role}
                onChange={(e) => update((s) => ({ ...s, role: e.target.value as typeof s.role }))}
                className="rounded-lg border border-input bg-card px-2 py-1.5 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        {state.branding.brandName} — {state.branding.tagline} · Kaartdata © OpenStreetMap · Weer via
        Open-Meteo · Koersen via Frankfurter/ECB
      </footer>
    </div>
  );
}
