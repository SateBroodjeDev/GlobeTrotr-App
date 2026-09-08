import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getCorporateAdminData, saveKnownIssue, updateFeedbackStatus } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin")({
  beforeLoad: ({ context }) => { if (context.user.app_metadata?.corporate_admin !== true) throw redirect({to:"/dashboard"}); },
  component: CorporateAdminPage,
});

function CorporateAdminPage() {
  const { text } = useLocale();
  const query = useQuery({queryKey:["corporate-admin-data"],queryFn:()=>getCorporateAdminData()});
  const emptyForm = {titleNl:"",titleEn:"",descriptionNl:"",descriptionEn:"",status:"investigating" as const,severity:"medium" as const,public:true};
  const [form,setForm]=useState<typeof emptyForm & {id?:string}>(emptyForm);
  const [saving,setSaving]=useState(false);
  async function save(){
    setSaving(true);
    try {
      const result=await saveKnownIssue({data:form});
      if (result.github.synced) toast.success(text("Opgeslagen en met GitHub gesynchroniseerd.","Saved and synced with GitHub."));
      else {
        const reason = result.github.reason;
        const messages: Record<string,[string,string]> = {
          not_configured:["Opgeslagen, maar de GitHub-secrets zijn niet beschikbaar in deze publicatie.","Saved, but the GitHub secrets are unavailable in this deployment."],
          repository_invalid:["Opgeslagen, maar de repository moet als eigenaar/repository zijn ingesteld.","Saved, but the repository must use owner/repository format."],
          http_401:["Opgeslagen, maar GitHub weigert het token. Maak of kopieer het token opnieuw.","Saved, but GitHub rejected the token. Recreate or recopy the token."],
          http_403:["Opgeslagen, maar het GitHub-token heeft geen toegang met Issues: write.","Saved, but the GitHub token lacks access with Issues: write."],
          http_404:["Opgeslagen, maar GitHub kan de repository niet vinden voor dit token.","Saved, but GitHub cannot find the repository for this token."],
          http_410:["Opgeslagen, maar GitHub Issues staat uit voor deze repository.","Saved, but GitHub Issues is disabled for this repository."],
          http_422:["Opgeslagen, maar GitHub heeft de issue-inhoud afgewezen.","Saved, but GitHub rejected the issue content."],
          network_error:["Opgeslagen, maar de GitHub-verbinding is mislukt.","Saved, but the GitHub connection failed."],
        };
        const message=messages[reason]??["Opgeslagen, maar GitHub-synchronisatie is mislukt.","Saved, but GitHub synchronization failed."];
        toast.warning(text(message[0],message[1]));
      }
      setForm(emptyForm); await query.refetch();
    }
    catch (error) { console.error(error); toast.error(text("Opslaan in GlobeTrotr is mislukt. Controleer de invoer en database.","Saving in GlobeTrotr failed. Check the input and database.")); }
    finally {setSaving(false);}
  }
  return <div className="space-y-6"><div><h1 className="font-display text-3xl font-semibold">Corporate Admin</h1><p className="mt-2 text-sm text-muted-foreground">{text("Beheer feedback en de openbare lijst met bekende problemen.","Manage feedback and the public known-issues list.")}</p></div>
    <Card><CardHeader><CardTitle>{text("Bekend probleem publiceren","Publish known issue")}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Titel NL"><Input value={form.titleNl} maxLength={160} onChange={e=>setForm({...form,titleNl:e.target.value})}/></Field><Field label="Title EN"><Input value={form.titleEn} maxLength={160} onChange={e=>setForm({...form,titleEn:e.target.value})}/></Field>
      <Field label="Omschrijving NL"><Textarea value={form.descriptionNl} onChange={e=>setForm({...form,descriptionNl:e.target.value})}/></Field><Field label="Description EN"><Textarea value={form.descriptionEn} onChange={e=>setForm({...form,descriptionEn:e.target.value})}/></Field>
      <Field label={text("Status","Status")}><select className="h-10 w-full rounded-md border bg-background px-3" value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}><option value="investigating">investigating</option><option value="planned">planned</option><option value="monitoring">monitoring</option><option value="resolved">resolved</option></select></Field>
      <Field label={text("Ernst","Severity")}><select className="h-10 w-full rounded-md border bg-background px-3" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as any})}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option></select></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.public} onChange={e=>setForm({...form,public:e.target.checked})}/>{text("Openbaar tonen","Show publicly")}</label>
      <Button disabled={saving||!form.titleNl||!form.titleEn||!form.descriptionNl||!form.descriptionEn} onClick={()=>void save()}>{saving?text("Opslaan…","Saving…"):form.id?text("Wijzigingen synchroniseren","Sync changes"):text("Opslaan en synchroniseren","Save and sync")}</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Bekende problemen","Known issues")}</CardTitle></CardHeader><CardContent className="space-y-3">{query.data?.issues.map((issue:any)=><div key={issue.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><strong>{issue.title_nl}</strong><Badge variant="outline">{issue.status}</Badge>{issue.github_issue_number&&<Badge>GitHub #{issue.github_issue_number}</Badge>}<Button className="ml-auto" size="sm" variant="outline" onClick={()=>{setForm({id:issue.id,titleNl:issue.title_nl,titleEn:issue.title_en,descriptionNl:issue.description_nl,descriptionEn:issue.description_en,status:issue.status,severity:issue.severity,public:issue.public});window.scrollTo({top:0,behavior:"smooth"});}}>{text("Bewerken","Edit")}</Button></div><p className="mt-2 text-sm text-muted-foreground">{issue.description_nl}</p></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Ontvangen feedback","Received feedback")}</CardTitle></CardHeader><CardContent className="space-y-3">{query.data?.feedback.map((item:any)=><div key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.title}</strong><select className="rounded-md border bg-background px-2 text-xs" value={item.status} onChange={async e=>{await updateFeedbackStatus({data:{id:item.id,status:e.target.value as any}});await query.refetch();}}><option value="new">new</option><option value="reviewing">reviewing</option><option value="planned">planned</option><option value="resolved">resolved</option><option value="closed">closed</option></select></div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{item.page_url}</p></div>)}</CardContent></Card>
  </div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="space-y-1.5"><Label>{label}</Label>{children}</label>;}
