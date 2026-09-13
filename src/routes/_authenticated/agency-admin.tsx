import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, BookTemplate, Building2, CreditCard, FileText, History, LayoutDashboard, ListTodo, Settings2, ShieldAlert, ShieldCheck, Truck, Users } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { useLocale } from "@/lib/locale";
import { getMyAgencyAccess } from "@/lib/agency.functions";
import type { AgencyPermission } from "@/lib/agency-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route=createFileRoute("/_authenticated/agency-admin")({component:AgencyAdminLayout});
const items=[
 {to:"/agency-admin",nl:"Overzicht",en:"Overview",icon:LayoutDashboard,exact:true},
 {to:"/agency-admin/settings",nl:"Organisatie",en:"Organisation",icon:Settings2,permission:"branding_manage"},
 {to:"/agency-admin/permissions",nl:"Rollen en rechten",en:"Roles and permissions",icon:ShieldCheck,ownerOnly:true},
 {to:"/agency-admin/clients",nl:"Klanten",en:"Clients",icon:Users,permission:"members_manage"},
 {to:"/agency-admin/suppliers",nl:"Leveranciers",en:"Suppliers",icon:Truck,permission:"trips_view"},
 {to:"/agency-admin/operations",nl:"Operatie",en:"Operations",icon:BarChart3,permission:"analytics_view"},
 {to:"/agency-admin/tasks",nl:"Taken",en:"Tasks",icon:ListTodo,permission:"trips_view"},
 {to:"/agency-admin/templates",nl:"Sjablonen",en:"Templates",icon:BookTemplate,permission:"trips_view"},
 {to:"/agency-admin/quotes",nl:"Offertes",en:"Quotes",icon:FileText,permission:"trips_view"},
 {to:"/agency-admin/audit",nl:"Activiteit",en:"Activity",icon:History,ownerOnly:true},
 {to:"/agency-admin/security",nl:"Beveiliging",en:"Security",icon:ShieldAlert,ownerOnly:true},
 {to:"/agency-admin/notifications",nl:"Meldingen",en:"Notifications",icon:Bell},
 {to:"/agency-admin/subscription",nl:"Abonnement",en:"Plan",icon:CreditCard,permission:"billing_manage"},
] as const;
function AgencyAdminLayout(){
 const {state}=useWorkspace();const {text}=useLocale();const path=useRouterState({select:s=>s.location.pathname});
 const access=useQuery({queryKey:["my-agency-access"],queryFn:()=>getMyAgencyAccess(),enabled:state.plan==="agency",retry:false});
 if(state.plan!=="agency")return <Card className="surface"><CardContent className="flex gap-3 p-6"><Building2 className="size-5 text-primary"/><div><h1 className="font-display text-xl font-semibold">Agency Admin</h1><p className="mt-1 text-sm text-muted-foreground">{text("Deze omgeving vereist een actief Agency-plan.","This area requires an active Agency plan.")}</p><Button asChild className="mt-4"><Link to="/billing">{text("Bekijk abonnementen","View plans")}</Link></Button></div></CardContent></Card>;
 if(access.isLoading)return <p className="text-sm text-muted-foreground">{text("Agency-rechten laden…","Loading Agency permissions…")}</p>;
 if(!access.data)return <Card className="surface"><CardContent className="p-6"><h1 className="font-display text-xl font-semibold">{text("Geen Agency-toegang","No Agency access")}</h1><p className="mt-2 text-sm text-muted-foreground">{text("Je account heeft geen actieve rol binnen deze Agency-workspace.","Your account has no active role in this Agency workspace.")}</p></CardContent></Card>;
 const visibleItems=items.filter(item=>(!("ownerOnly" in item)||!item.ownerOnly||access.data.role==="owner")&&(!("permission" in item)||!item.permission||access.data.permissions[item.permission as AgencyPermission]));
 return <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"><aside className="h-fit lg:sticky lg:top-24"><div className="mb-3 hidden px-3 lg:block"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency workspace</p><p className="mt-1 truncate font-display font-semibold">{state.branding.brandName}</p></div><nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" aria-label="Agency Admin">{visibleItems.map(item=>{const active=item.exact?path==="/agency-admin"||path==="/agency-admin/":path.startsWith(item.to);return <Button key={item.to} asChild variant={active?"secondary":"ghost"} className="shrink-0 justify-start"><Link to={item.to}><item.icon className="size-4"/>{text(item.nl,item.en)}</Link></Button>})}</nav></aside><main className="min-w-0"><Outlet/></main></div>;
}
