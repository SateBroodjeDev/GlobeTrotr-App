import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getCorporateAdminData, manageAdminRecord, saveKnownIssue, updateFeedbackStatus } from "@/lib/issues.functions";
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

  return <div className="space-y-6">
    <header><h1 className="font-display text-3xl font-semibold">Corporate Admin</h1><p className="mt-2 text-sm text-muted-foreground">{text("Beheer feedback en bekende problemen.","Manage feedback and known issues.")}</p></header>
    <Card><CardHeader><CardTitle>{form.id?text("Bekend probleem bewerken","Edit known issue"):text("Bekend probleem publiceren","Publish known issue")}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
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
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>{text("Gearchiveerde items tonen","Show archived items")}</label>
    <Card><CardHeader><CardTitle>{text("Bekende problemen","Known issues")}</CardTitle></CardHeader><CardContent className="space-y-3">
      {query.data?.issues.filter((x:any)=>showArchived||!x.archived_at).map((issue:any)=><div key={issue.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><strong>{issue.title_nl}</strong><Badge>{issueCategoryLabel(issue.category,text)}</Badge><Badge variant="outline">{statusLabel(issue.status)}</Badge><Badge variant="outline">{severityLabel(issue.severity)}</Badge>{issue.archived_at&&<Badge>{text("Gearchiveerd","Archived")}</Badge>}{issue.github_issue_number&&<Badge>GitHub #{issue.github_issue_number}</Badge>}<span className="ml-auto flex gap-1"><Button size="sm" variant="outline" onClick={()=>{setForm({id:issue.id,titleNl:issue.title_nl,titleEn:issue.title_en,descriptionNl:issue.description_nl,descriptionEn:issue.description_en,category:issue.category,status:issue.status,severity:issue.severity,public:issue.public});window.scrollTo({top:0,behavior:"smooth"});}}>{text("Bewerken","Edit")}</Button><ActionIcon archived={Boolean(issue.archived_at)} onClick={()=>void manage("issue",issue.id,issue.archived_at?"restore":"archive")} text={text}/><DeleteIcon onClick={()=>void manage("issue",issue.id,"delete")} text={text}/></span></div><p className="mt-2 text-sm text-muted-foreground">{issue.description_nl}</p></div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Ontvangen feedback","Received feedback")}</CardTitle></CardHeader><CardContent className="space-y-3">
      {query.data?.feedback.filter((x:any)=>showArchived||!x.archived_at).map((item:any)=><div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><Badge>{issueCategoryLabel(item.category,text)}</Badge><select className="rounded-md border bg-background px-2 py-1 text-xs" value={item.status} onChange={async e=>{await updateFeedbackStatus({data:{id:item.id,status:e.target.value as any}});await query.refetch();}}>{["new","reviewing","planned","resolved","closed"].map(v=><option key={v} value={v}>{statusLabel(v)}</option>)}</select>{item.archived_at&&<Badge>{text("Gearchiveerd","Archived")}</Badge>}<span className="ml-auto flex gap-1"><ActionIcon archived={Boolean(item.archived_at)} onClick={()=>void manage("feedback",item.id,item.archived_at?"restore":"archive")} text={text}/><DeleteIcon onClick={()=>void manage("feedback",item.id,"delete")} text={text}/></span></div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{item.page_url}</p></div>)}
    </CardContent></Card>
  </div>;
}

function Field({label,children}:{label:string;children:ReactNode}) { return <label className="space-y-1.5"><Label>{label}</Label>{children}</label>; }
function ActionIcon({archived,onClick,text}:{archived:boolean;onClick:()=>void;text:(nl:string,en:string)=>string}) { return <Button size="icon" variant="outline" title={archived?text("Herstellen","Restore"):text("Archiveren","Archive")} onClick={onClick}>{archived?<RotateCcw className="size-4"/>:<Archive className="size-4"/>}</Button>; }
function DeleteIcon({onClick,text}:{onClick:()=>void;text:(nl:string,en:string)=>string}) { return <Button size="icon" variant="destructive" title={text("Verwijderen","Delete")} onClick={onClick}><Trash2 className="size-4"/></Button>; }
