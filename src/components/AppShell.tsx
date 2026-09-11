import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  AlertTriangle,
  BookOpenText,
  ChevronDown,
  CreditCard,
  Compass,
  Languages,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Moon,
  Palette,
  Sun,
  UserRound,
  Users,
  Shield,
  Building2,
  BriefcaseBusiness,
  Tags,
  Scale,
  RotateCcw,
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
import { PlatformStatusBanner } from "@/components/PlatformStatusBanner";
import { useLocale } from "@/lib/locale";
import { localizeTagline } from "@/lib/localized-values";
import { openPrivacyChoices } from "@/lib/privacy-consent";
import { getMyAgencyAccess } from "@/lib/agency.functions";

const CORE_NAV = [{ to: "/dashboard", label: "Reizen", icon: Map }] as const;
const AGENCY_NAV = [
  { to: "/agency-admin", label: "Agency Admin", icon: Building2 },
] as const;
const CLIENT_NAV = [{ to: "/client-portal", label: "Klantportaal", icon: BriefcaseBusiness }] as const;
const PUBLIC_NAV = [{ to: "/", label: "Home", icon: Map }] as const;
type ThemePreference = "system" | "light" | "dark";
const THEME_STORAGE_KEY = "globetrotr.theme";
const asTheme = (value: unknown): ThemePreference =>
  value === "light" || value === "dark" ? value : "system";
const cachedTheme = (): ThemePreference => {
  if (typeof window === "undefined") return "system";
  return asTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
};

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellContent>{children}</AppShellContent>;
}

function FooterMenu({label,children}:{label:string;children:ReactNode}) {
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary">{label}<ChevronDown className="size-3.5"/></button></DropdownMenuTrigger><DropdownMenuContent align="end" side="top" className="min-w-48">{children}</DropdownMenuContent></DropdownMenu>;
}

// WorkspaceProvider staat in de root-layout, direct onder AuthProvider. Zo
// delen shell en routes ook tijdens Lovable/Vite-refreshes altijd dezelfde
// contextinstantie.
function AppShellContent({ children }: { children: ReactNode }) {
  const { state, cloud, refreshWorkspace } = useWorkspace();
  const plan = planOf(state.plan);
  const { user } = useAuth();
  const { locale, setLocale, text } = useLocale();
  const navigate = useNavigate();
  const corporateAdmin = useRouterState({ select: (routerState) => routerState.location.pathname.startsWith("/corporate-admin") });
  const queryClient = useQueryClient();
  const [guestTheme, setGuestTheme] = useState<ThemePreference>(cachedTheme);
  const [dark, setDark] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string>();
  const agencyRefreshPending = useRef(false);
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
  const agencyAccessQuery = useQuery({
    queryKey: ["agency-access-watch", user?.id],
    enabled: Boolean(user && state.plan === "agency"),
    queryFn: async () => {
      try {
        await getMyAgencyAccess();
        return true;
      } catch {
        return false;
      }
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });
  const preference = user
    ? profileQuery.data === undefined ? cachedTheme() : asTheme(profileQuery.data?.theme)
    : guestTheme;
  const navItems = user
    ? [...CORE_NAV, ...(state.trips.some((trip) => trip.accessRole === "client") ? CLIENT_NAV : []), ...(state.plan === "agency" ? AGENCY_NAV : []), ...(user.app_metadata?.corporate_admin === true ? [{to:"/corporate-admin",label:"Corporate Admin",icon:Shield} as const] : [])]
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
    if (agencyAccessQuery.data !== false || agencyRefreshPending.current) return;
    agencyRefreshPending.current = true;
    refreshWorkspace()
      .then(() => queryClient.removeQueries({ queryKey: ["agency-access-watch", user?.id] }))
      .catch(() => undefined)
      .finally(() => {
        agencyRefreshPending.current = false;
      });
  }, [agencyAccessQuery.data, queryClient, refreshWorkspace, user?.id]);
  useEffect(() => {
    if (state.plan !== "agency" || !state.branding.logoPath) {
      setAgencyLogoUrl(undefined);
      return;
    }
    let active=true;
    supabase.storage.from("agency-logos").createSignedUrl(state.branding.logoPath,60*60)
      .then(({data})=>{if(active)setAgencyLogoUrl(data?.signedUrl?`${data.signedUrl}&v=${encodeURIComponent(state.branding.logoPath!)}`:undefined)});
    return()=>{active=false};
  }, [state.plan,state.branding.logoPath]);
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
    if (user && profileQuery.data !== undefined) {
      window.localStorage.setItem(THEME_STORAGE_KEY, asTheme(profileQuery.data?.theme));
    }
  }, [profileQuery.data, user]);
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
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    if (!user) {
      setGuestTheme(next);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, theme: next });
    if (!error) await queryClient.invalidateQueries({ queryKey: ["profile-theme", user.id] });
  }
  if (corporateAdmin) {
    return <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-6">
          <Link to="/corporate-admin" className="flex min-w-0 items-center gap-3">
            <img src={logoIcon.url} alt="GlobeTrotr" className="size-9 rounded-xl" />
            <span className="min-w-0"><strong className="block truncate font-display">GlobeTrotr</strong><span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Corporate operations</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><LayoutDashboard className="size-4" />{text("Reisplatform", "Travel platform")}</Link></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={dark ? text("Lichte modus", "Light mode") : text("Donkere modus", "Dark mode")} onClick={() => void toggleTheme()}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label={text("Beheerdersmenu", "Administrator menu")}><Avatar className="size-8"><AvatarImage src={avatarUrl} /><AvatarFallback>{initials}</AvatarFallback></Avatar></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>{displayName}<span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user?.email}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/account"><UserRound className="size-4" />{text("Accountinstellingen", "Account settings")}</Link></DropdownMenuItem><DropdownMenuItem onSelect={() => void signOut()}><LogOut className="size-4" />{text("Uitloggen", "Sign out")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>
      </header>
      {user && <PlatformStatusBanner userId={user.id} />}
      <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6 lg:py-8">{children}</main>
    </div>;
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={agencyLogoUrl ?? logoIcon.url}
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
                {item.to === "/dashboard" ? text("Reizen", "Trips") : item.to === "/client-portal" ? text("Klantportaal", "Client portal") : item.label}
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
            {!user && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 font-semibold"
                aria-label={text("Schakel naar Engels", "Switch to Dutch")}
                title={locale === "nl-NL" ? "English" : "Nederlands"}
                onClick={() => void setLocale(locale === "nl-NL" ? "en-GB" : "nl-NL")}
              >
                <Languages className="size-4" />
                <span>{locale === "nl-NL" ? "EN" : "NL"}</span>
              </Button>
            )}
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
      {user && <PlatformStatusBanner userId={user.id} />}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-10 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {state.branding.brandName} — {localizeTagline(state.branding.tagline, locale)}
        </p>
        <nav
          aria-label={text("Voetnavigatie", "Footer navigation")}
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <FooterMenu label={text("Ontdek", "Explore")}>
            <DropdownMenuItem asChild><Link to="/mogelijkheden"><Map className="size-4"/>{text("Mogelijkheden", "Features")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/prijzen"><Tags className="size-4"/>{text("Prijzen", "Pricing")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/roadmap"><Compass className="size-4"/>Roadmap</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/changelog"><BookOpenText className="size-4"/>{text("Wat is er nieuw?", "What's new?")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/bekende-problemen"><AlertTriangle className="size-4"/>{text("Bekende problemen", "Known issues")}</Link></DropdownMenuItem>
          </FooterMenu>
          <FooterMenu label={text("Privacy & voorwaarden", "Privacy & terms")}>
            <DropdownMenuItem asChild><Link to="/privacy">{text("Privacyverklaring", "Privacy notice")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/algemene-voorwaarden"><Scale className="size-4"/>{text("Algemene voorwaarden", "Terms and conditions")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/terugbetalingsbeleid"><RotateCcw className="size-4"/>{text("Terugbetalingsbeleid", "Refund policy")}</Link></DropdownMenuItem>
            {!user&&<DropdownMenuItem onSelect={event=>{event.preventDefault();openPrivacyChoices();}}>{text("Privacykeuzes", "Privacy choices")}</DropdownMenuItem>}
            <DropdownMenuItem asChild><Link to="/beta-voorwaarden">{text("Beta-voorwaarden", "Beta terms")}</Link></DropdownMenuItem>
          </FooterMenu>
          <span>{text("Data via", "Data by")} OpenStreetMap · Open-Meteo/MET Norway · Frankfurter/ECB</span>
        </nav>
      </footer>
    </div>
  );
}
