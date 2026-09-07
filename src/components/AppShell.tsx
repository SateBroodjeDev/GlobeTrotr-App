import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpenText,
  CreditCard,
  Languages,
  LogIn,
  LogOut,
  Map,
  Moon,
  Palette,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { planOf } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logoIcon from "@/assets/logo-icon.asset.json";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useLocale } from "@/lib/locale";

const CORE_NAV = [{ to: "/dashboard", label: "Reizen", icon: Map }] as const;
const AGENCY_NAV = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/team", label: "Team & rollen", icon: Users },
  { to: "/branding", label: "White-label", icon: Palette },
] as const;
const PUBLIC_NAV = [{ to: "/", label: "Home", icon: Map }] as const;
type ThemePreference = "system" | "light" | "dark";
const asTheme = (value: unknown): ThemePreference =>
  value === "light" || value === "dark" ? value : "system";

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellContent>{children}</AppShellContent>;
}

// WorkspaceProvider staat in de root-layout, direct onder AuthProvider. Zo
// delen shell en routes ook tijdens Lovable/Vite-refreshes altijd dezelfde
// contextinstantie.
function AppShellContent({ children }: { children: ReactNode }) {
  const { state, cloud } = useWorkspace();
  const plan = planOf(state.plan);
  const { user } = useAuth();
  const { locale, setLocale, text } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [guestTheme, setGuestTheme] = useState<"light" | "dark">("light");
  const [dark, setDark] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const profileQuery = useQuery({
    queryKey: ["profile-theme", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme, display_name, avatar_path")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        theme: string | null;
        display_name: string | null;
        avatar_path: string | null;
      } | null;
    },
  });
  const preference = user ? asTheme(profileQuery.data?.theme) : guestTheme;
  const navItems = user
    ? [...CORE_NAV, ...(state.plan === "agency" ? AGENCY_NAV : [])]
    : PUBLIC_NAV;
  const displayName =
    profileQuery.data?.display_name ||
    String(user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "Account");
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G";
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
    if (!profileQuery.data?.avatar_path) {
      setAvatarUrl(undefined);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profileQuery.data.avatar_path, 60 * 60)
      .then(({ data }) => setAvatarUrl(data?.signedUrl));
  }, [profileQuery.data?.avatar_path]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = preference === "dark" || (preference === "system" && media.matches);
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };
    apply();
    if (preference !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);
  async function toggleTheme() {
    const next = dark ? "light" : "dark";
    if (!user) {
      setGuestTheme(next);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, theme: next });
    if (!error) await queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] });
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
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
                {item.to === "/dashboard" ? text("Reizen", "Trips") : item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user && <NotificationPanel key={user.id} userId={user.id} />}
            {user && cloud === "saving" && (
              <span className="mr-2 hidden text-xs text-muted-foreground sm:block">
                {text("Opslaan…", "Saving…")}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={text("Schakel naar Engels", "Switch to Dutch")}
              title={locale === "nl-NL" ? "English" : "Nederlands"}
              onClick={() => void setLocale(locale === "nl-NL" ? "en-GB" : "nl-NL")}
            >
              <Languages className="size-4" />
              <span className="sr-only">{locale === "nl-NL" ? "EN" : "NL"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={dark ? "Schakel lichte modus in" : "Schakel donkere modus in"}
              title={dark ? "Lichte modus" : "Donkere modus"}
              onClick={() => void toggleTheme()}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Accountmenu"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    {displayName}
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account">
                      <UserRound className="size-4" /> Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/billing">
                      <CreditCard className="size-4" /> {text("Abonnement", "Plan")} ({plan.name})
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>
                    <LogOut className="size-4" /> {text("Uitloggen", "Sign out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Accountmenu">
                    <UserRound className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/auth">
                      <LogIn className="size-4" /> {text("Inloggen", "Sign in")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/auth">
                      <UserRound className="size-4" /> {text("Registreren", "Create account")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-10 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {state.branding.brandName} — {state.branding.tagline}
        </p>
        <nav
          aria-label={text("Voetnavigatie", "Footer navigation")}
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <Link
            to="/changelog"
            className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
          >
            <BookOpenText className="size-3.5" /> {text("Wat is er nieuw?", "What's new?")}
          </Link>
          <Link to="/privacy" className="font-medium text-foreground transition-colors hover:text-primary">
            {text("Privacy", "Privacy")}
          </Link>
          <Link to="/beta-voorwaarden" className="font-medium text-foreground transition-colors hover:text-primary">
            {text("Beta-voorwaarden", "Beta terms")}
          </Link>
          <span>{text("Kaartdata", "Map data")} © OpenStreetMap</span>
          <span>{text("Weer via", "Weather by")} Open-Meteo</span>
          <span>{text("Koersen via", "Rates by")} Frankfurter/ECB</span>
        </nav>
      </footer>
    </div>
  );
}
