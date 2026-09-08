import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Archive, Building2, Download, History, MessageSquareWarning, RotateCcw, Route as RouteIcon, Trash2, Users, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getCorporateAdminData, importBetaKnownIssues, manageAdminRecord, saveKnownIssue, updateFeedbackStatus } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";
import { ISSUE_CATEGORIES, issueCategoryLabel } from "@/lib/issue-categories";

export const Route = createFileRoute("/_authenticated/corporate-admin")({
  beforeLoad: ({ context }) => { if (context.user.app_metadata?.corporate_admin !== true) throw redirect({to:"/dashboard"}); },
  component: CorporateAdminPage,
});

const initialForm = { titleNl:"", titleEn:"", descriptionNl:"", descriptionEn:"", category:"bug" as const, status:"investigating" as const, severity:"medium" as const, public:true };

function CorporateAdminPage() {
  const { text } = useLocale();
  const query = useQuery({queryKey:["corporate-admin-data"],queryFn:()=>getCorporateAdminData()});
  const [form,setForm]=useState<typeof initialForm & {id?:string}>(initialForm);
  const [saving,setSaving]=useState(false);
  const [showArchived,setShowArchived]=useState(false);
  const [search,setSearch]=useState("");
  const [categoryFilter,setCategoryFilter]=useState("all");
  const statusLabel=(value:string)=>({new:text("Nieuw","New"),reviewing:text("In beoordeling","Reviewing"),planned:text("Gepland","Planned"),resolved:text("Opgelost","Resolved"),closed:text("Gesloten","Closed"),investigating:text("In onderzoek","Investigating"),monitoring:text("Wordt gemonitord","Monitoring")}[value]??value);
  const severityLabel=(value:string)=>({low:text("Laag","Low"),medium:text("Gemiddeld","Medium"),high:text("Hoog","High"),critical:text("Kritiek","Critical")}[value]??value);

  async function save() {
    setSaving(true);
    try {
      const result=await saveKnownIssue({data:form});
      if(result.github.synced) toast.success(text("Opgeslagen en met GitHub gesynchroniseerd.","Saved and synced with GitHub."));
      else toast.warning(text("Opgeslagen, maar GitHub-synchronisatie is mislukt.","Saved, but GitHub synchronization failed."));
      setForm(initialForm); await query.refetch();
    } catch { toast.error(text("Opslaan in GlobeTrotr is mislukt.","Saving in GlobeTrotr failed.")); }
    finally { setSaving(false); }
  }
  async function manage(kind:"feedback"|"issue",id:string,action:"archive"|"restore"|"delete") {
    if(action==="delete"&&!window.confirm(text("Definitief verwijderen? Dit kan niet ongedaan worden gemaakt.","Permanently delete? This cannot be undone."))) return;
    try { await manageAdminRecord({data:{kind,id,action}}); await query.refetch(); toast.success(action==="delete"?text("Verwijderd.","Deleted."):action==="archive"?text("Gearchiveerd.","Archived."):text("Hersteld.","Restored.")); }
    catch { toast.error(text("De beheeractie is mislukt.","The admin action failed.")); }
  }
  async function importIssues() {
    try { const result=await importBetaKnownIssues(); await query.refetch(); toast.success(result.imported?text(`${result.imported} bekende beperkingen geïmporteerd.`,`${result.imported} known limitations imported.`):text("Alle bekende beperkingen waren al aanwezig.","All known limitations were already present.")); }
    catch { toast.error(text("Importeren is mislukt.","Import failed.")); }
  }

  const matches=(item:any)=>{
    const term=search.trim().toLocaleLowerCase();
    return (categoryFilter==="all"||item.category===categoryFilter)&&(!term||[item.title,item.title_nl,item.title_en,item.description,item.description_nl,item.description_en].some(value=>String(value??"").toLocaleLowerCase().includes(term)));
  };
  const metrics=query.data?.metrics;

  return <div className="space-y-6">
    <header><h1 className="font-display text-3xl font-semibold">Corporate Admin</h1><p className="mt-2 text-sm text-muted-foreground">{text("Bedrijfsoverzicht, feedback en bekende problemen van GlobeTrotr.","GlobeTrotr business overview, feedback and known issues.")}</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label={text("Workspaces","Workspaces")} value={metrics?.workspaces} detail={text(`${metrics?.newWorkspaces30d??0} nieuw in 30 dagen`,`${metrics?.newWorkspaces30d??0} new in 30 days`)}/>
      <Metric icon={Building2} label={text("Actief in 30 dagen","Active in 30 days")} value={metrics?.activeWorkspaces30d} detail={text("Gebaseerd op workspace-activiteit","Based on workspace activity")}/>
      <Metric icon={RouteIcon} label={text("Actieve reizen","Active trips")} value={metrics?.activeTrips} detail={text(`${metrics?.publicTrips??0} openbaar`,`${metrics?.publicTrips??0} public`)}/>
      <Metric icon={MessageSquareWarning} label={text("Open werk","Open work")} value={(metrics?.openFeedback??0)+(metrics?.openIssues??0)} detail={text(`${metrics?.openFeedback??0} feedback · ${metrics?.openIssues??0} problemen`,`${metrics?.openFeedback??0} feedback · ${metrics?.openIssues??0} issues`)}/>
    </section>
    <Card><CardHeader><CardTitle>{text("Planverdeling","Plan distribution")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{(["free","pro","agency"] as const).map(plan=><div key={plan} className="rounded-xl border bg-muted/20 p-4"><div className="text-sm font-medium capitalize">{plan}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{metrics?.plans[plan]??"—"}</div></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5 text-primary"/>{text("Recente beheeractiviteit","Recent admin activity")}</CardTitle></CardHeader><CardContent className="space-y-2">{query.data?.auditLog.length?query.data.auditLog.slice(0,8).map((entry:any)=><div key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs"><Badge variant={entry.result==="success"?"secondary":"destructive"}>{entry.result==="success"?text("Geslaagd","Success"):text("Mislukt","Failed")}</Badge><strong>{entry.action}</strong>{entry.target_id&&<span className="font-mono text-muted-foreground">{String(entry.target_id).slice(0,12)}</span>}<time className="ml-auto text-muted-foreground">{new Intl.DateTimeFormat(undefined,{dateStyle:"short",timeStyle:"short"}).format(new Date(entry.created_at))}</time></div>):<p className="text-sm text-muted-foreground">{text("Nog geen beheeractiviteit vastgelegd.","No admin activity recorded yet.")}</p>}</CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>{form.id?text("Bekend probleem bewerken","Edit known issue"):text("Bekend probleem publiceren","Publish known issue")}</CardTitle>{!form.id&&<Button variant="outline" size="sm" onClick={()=>void importIssues()}><Download className="size-4"/>{text("Beta-beperkingen importeren","Import beta limitations")}</Button>}</CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Titel NL"><Input value={form.titleNl} maxLength={160} onChange={e=>setForm({...form,titleNl:e.target.value})}/></Field>
      <Field label="Title EN"><Input value={form.titleEn} maxLength={160} onChange={e=>setForm({...form,titleEn:e.target.value})}/></Field>
      <Field label="Omschrijving NL"><Textarea value={form.descriptionNl} maxLength={2000} onChange={e=>setForm({...form,descriptionNl:e.target.value})}/></Field>
      <Field label="Description EN"><Textarea value={form.descriptionEn} maxLength={2000} onChange={e=>setForm({...form,descriptionEn:e.target.value})}/></Field>
      <Field label={text("Categorie","Category")}><select className="h-10 w-full rounded-md border bg-background px-3" value={form.category} onChange={e=>setForm({...form,category:e.target.value as any})}>{ISSUE_CATEGORIES.map(v=><option key={v} value={v}>{issueCategoryLabel(v,text)}</option>)}</select></Field>
      <Field label={text("Status","Status")}><select className="h-10 w-full rounded-md border bg-background px-3" value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}>{["investigating","planned","monitoring","resolved"].map(v=><option key={v} value={v}>{statusLabel(v)}</option>)}</select></Field>
      <Field label={text("Ernst","Severity")}><select className="h-10 w-full rounded-md border bg-background px-3" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as any})}>{["low","medium","high","critical"].map(v=><option key={v} value={v}>{severityLabel(v)}</option>)}</select></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.public} onChange={e=>setForm({...form,public:e.target.checked})}/>{text("Openbaar tonen","Show publicly")}</label>
      <div className="flex gap-2"><Button className="flex-1" disabled={saving||!form.titleNl||!form.titleEn||!form.descriptionNl||!form.descriptionEn} onClick={()=>void save()}>{saving?text("Opslaan…","Saving…"):text("Opslaan en synchroniseren","Save and sync")}</Button>{form.id&&<Button variant="outline" onClick={()=>setForm(initialForm)}>{text("Annuleren","Cancel")}</Button>}</div>
    </CardContent></Card>
    <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end"><Field label={text("Zoeken","Search")}><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder={text("Zoek in feedback en problemen…","Search feedback and issues…")}/></Field><Field label={text("Categorie","Category")}><select className="h-10 w-full rounded-md border bg-background px-3" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">{text("Alle categorieën","All categories")}</option>{ISSUE_CATEGORIES.map(v=><option key={v} value={v}>{issueCategoryLabel(v,text)}</option>)}</select></Field><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>{text("Archief tonen","Show archive")}</label></div>
    <Card><CardHeader><CardTitle>{text("Bekende problemen","Known issues")}</CardTitle></CardHeader><CardContent className="space-y-3">
      {query.data?.issues.filter((x:any)=>(showArchived||!x.archived_at)&&matches(x)).map((issue:any)=><div key={issue.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><strong>{issue.title_nl}</strong><Badge>{issueCategoryLabel(issue.category,text)}</Badge><Badge variant="outline">{statusLabel(issue.status)}</Badge><Badge variant="outline">{severityLabel(issue.severity)}</Badge>{issue.archived_at&&<Badge>{text("Gearchiveerd","Archived")}</Badge>}{issue.github_issue_number&&<Badge>GitHub #{issue.github_issue_number}</Badge>}<span className="ml-auto flex gap-1"><Button size="sm" variant="outline" onClick={()=>{setForm({id:issue.id,titleNl:issue.title_nl,titleEn:issue.title_en,descriptionNl:issue.description_nl,descriptionEn:issue.description_en,category:issue.category,status:issue.status,severity:issue.severity,public:issue.public});window.scrollTo({top:0,behavior:"smooth"});}}>{text("Bewerken","Edit")}</Button><ActionIcon archived={Boolean(issue.archived_at)} onClick={()=>void manage("issue",issue.id,issue.archived_at?"restore":"archive")} text={text}/><DeleteIcon onClick={()=>void manage("issue",issue.id,"delete")} text={text}/></span></div><p className="mt-2 text-sm text-muted-foreground">{issue.description_nl}</p></div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Ontvangen feedback","Received feedback")}</CardTitle></CardHeader><CardContent className="space-y-3">
      {query.data?.feedback.filter((x:any)=>(showArchived||!x.archived_at)&&matches(x)).map((item:any)=><div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><Badge>{issueCategoryLabel(item.category,text)}</Badge><select className="rounded-md border bg-background px-2 py-1 text-xs" value={item.status} onChange={async e=>{await updateFeedbackStatus({data:{id:item.id,status:e.target.value as any}});await query.refetch();}}>{["new","reviewing","planned","resolved","closed"].map(v=><option key={v} value={v}>{statusLabel(v)}</option>)}</select>{item.archived_at&&<Badge>{text("Gearchiveerd","Archived")}</Badge>}<span className="ml-auto flex gap-1"><ActionIcon archived={Boolean(item.archived_at)} onClick={()=>void manage("feedback",item.id,item.archived_at?"restore":"archive")} text={text}/><DeleteIcon onClick={()=>void manage("feedback",item.id,"delete")} text={text}/></span></div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{item.page_url}</p></div>)}
    </CardContent></Card>
  </div>;
}

function Field({label,children}:{label:string;children:ReactNode}) { return <label className="space-y-1.5"><Label>{label}</Label>{children}</label>; }
function Metric({icon:Icon,label,value,detail}:{icon:LucideIcon;label:string;value:number|undefined;detail:string}) { return <Card><CardContent className="flex items-start gap-3 p-5"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-5"/></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold tabular-nums">{value??"—"}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>; }
function ActionIcon({archived,onClick,text}:{archived:boolean;onClick:()=>void;text:(nl:string,en:string)=>string}) { return <Button size="icon" variant="outline" title={archived?text("Herstellen","Restore"):text("Archiveren","Archive")} onClick={onClick}>{archived?<RotateCcw className="size-4"/>:<Archive className="size-4"/>}</Button>; }
function DeleteIcon({onClick,text}:{onClick:()=>void;text:(nl:string,en:string)=>string}) { return <Button size="icon" variant="destructive" title={text("Verwijderen","Delete")} onClick={onClick}><Trash2 className="size-4"/></Button>; }
