import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, ClipboardCheck, Eye, Gauge, Inbox, Landmark, Mail, MessageSquare, Scale, Server, ShieldCheck, Star, TriangleAlert, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyCorporateCapabilities } from "@/lib/corporate-business.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin")({
  beforeLoad: ({ context }) => {
    if (context.user.app_metadata?.corporate_admin !== true) throw redirect({ to: "/dashboard" });
  },
  component: Layout,
});

function Layout() {
  const { text } = useLocale();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const access = useQuery({ queryKey: ["corporate-capabilities"], queryFn: () => getMyCorporateCapabilities(), retry: false });
  const permissions = access.data?.permissions;
  const links = [
    { to: "/corporate-admin", label: text("Overzicht", "Overview"), icon: Gauge, show: true, exact: true },
    { to: "/corporate-admin/users", label: text("Gebruikers", "Users"), icon: Users, show: permissions?.users },
    { to: "/corporate-admin/staff", label: text("Medewerkers", "Staff"), icon: UserCog, show: access.data?.role === "owner" },
    { to: "/corporate-admin/agencies", label: "Agencies", icon: Building2, show: permissions?.agencies },
    { to: "/corporate-admin/finance", label: text("Financiën", "Finance"), icon: Landmark, show: permissions?.finance },
    { to: "/corporate-admin/mail", label: text("Bedrijfsmail", "Company mail"), icon: Inbox, show: permissions?.mail },
    { to: "/corporate-admin/contact", label: text("Contact", "Contact"), icon: Mail, show: permissions?.mail },
    { to: "/corporate-admin/status", label: "Status", icon: Activity, show: permissions?.operations },
    { to: "/corporate-admin/infrastructure", label: text("Infrastructuur", "Infrastructure"), icon: Server, show: permissions?.operations },
    { to: "/corporate-admin/release-checklist", label: text("Releasecheck", "Release check"), icon: ClipboardCheck, show: permissions?.operations },
    { to: "/corporate-admin/governance", label: text("Governance", "Governance"), icon: Scale, show: permissions?.operations },
    { to: "/corporate-admin/notifications", label: text("Berichten", "Messages"), icon: MessageSquare, show: permissions?.operations },
    { to: "/corporate-admin/issues", label: text("Problemen", "Issues"), icon: TriangleAlert, show: permissions?.issues },
    { to: "/corporate-admin/feedback", label: "Feedback", icon: MessageSquare, show: permissions?.issues },
    { to: "/corporate-admin/testimonials", label: text("Recensies", "Testimonials"), icon: Star, show: permissions?.issues },
    { to: "/corporate-admin/public-trips", label: text("Openbare reizen", "Public trips"), icon: Eye, show: permissions?.issues },
    { to: "/corporate-admin/audit", label: "Auditlog", icon: ShieldCheck, show: permissions?.operations || access.data?.role === "owner" },
  ] as const;
  const visible = links.filter((item) => item.show);
  return <div className="space-y-6">
    <header><h1 className="font-display text-3xl font-semibold">Corporate Admin</h1><p className="mt-2 text-sm text-muted-foreground">{text("Beheer GlobeTrotr binnen jouw toegewezen bedrijfsrechten.", "Manage GlobeTrotr within your assigned company permissions.")}</p></header>
    {access.isError ? <p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{text("Je bedrijfsrechten konden niet worden geladen.", "Your company permissions could not be loaded.")}</p> :
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-24">
          <nav className="grid grid-cols-2 gap-1 rounded-xl border bg-background p-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Corporate Admin">
            {visible.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? path === "/corporate-admin" || path === "/corporate-admin/" : path.startsWith(to);
              return <Button key={to} asChild size="sm" variant={active ? "secondary" : "ghost"} className="min-w-0 justify-start"><Link to={to}><Icon className="size-4 shrink-0"/><span className="truncate">{label}</span></Link></Button>;
            })}
          </nav>
        </aside>
        <main className="min-w-0"><Outlet/></main>
      </div>}
  </div>;
}
