import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Megaphone, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listPlatformAnnouncements, publishPlatformAnnouncement } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/notifications")({ component: PlatformNotifications });
type Form = { type:"status"|"update"; severity:"info"|"warning"|"critical"|"resolved"; titleNl:string; titleEn:string; bodyNl:string; bodyEn:string; statusKey?:string };
const empty: Form = { type:"status", severity:"info", titleNl:"", titleEn:"", bodyNl:"", bodyEn:"" };

function PlatformNotifications() {
  const { locale, text } = useLocale();
  const [busy,setBusy] = useState(false);
  const [form,setForm] = useState<Form>(empty);
  const messages = useQuery({ queryKey:["platform-announcements"], queryFn:()=>listPlatformAnnouncements() });
  const active = (messages.data ?? []).filter((item:any)=>item.current && item.announcement_type==="status" && item.severity!=="resolved");
  function edit(item:any, resolved=false) {
    setForm({ type:"status", severity:resolved?"resolved":item.severity, titleNl:item.title_nl, titleEn:item.title_en, bodyNl:item.body_nl, bodyEn:item.body_en, statusKey:item.status_key });
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function publish() {
    if (!confirm(text("Dit bericht nu naar alle ingelogde gebruikers sturen?","Send this message to all signed-in users now?"))) return;
    setBusy(true);
    try {
      await publishPlatformAnnouncement({data:form});
      setForm(empty);
      await messages.refetch();
      toast.success(text("Platformbericht gepubliceerd.","Platform message published."));
    } catch { toast.error(text("Platformbericht kon niet worden gepubliceerd.","Platform message could not be published.")); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,.8fr)]">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="size-5"/>{form.statusKey?text("Status bijwerken","Update status"):text("Platformbericht publiceren","Publish platform message")}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{text("Een actuele status verschijnt ook als wegklikbare banner. Een oplossing sluit de banner en verschijnt als gewone melding rechtsboven.","A current status also appears as a dismissible banner. A resolution closes the banner and appears as a regular notification in the top right.")}</p><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">{text("Soort","Type")}<select disabled={Boolean(form.statusKey)} className="block h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={e=>setForm({...form,type:e.target.value as Form["type"],severity:e.target.value==="update"&&form.severity==="resolved"?"info":form.severity})}><option value="status">{text("Actuele platformstatus","Current platform status")}</option><option value="update">{text("Belangrijke update","Important update")}</option></select></label><label className="space-y-1 text-sm">{text("Ernst","Severity")}<select className="block h-10 w-full rounded-md border bg-background px-3" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as Form["severity"]})}><option value="info">Info</option><option value="warning">{text("Waarschuwing","Warning")}</option><option value="critical">{text("Kritiek","Critical")}</option>{form.type==="status"&&<option value="resolved">{text("Opgelost","Resolved")}</option>}</select></label><Input value={form.titleNl} onChange={e=>setForm({...form,titleNl:e.target.value})} placeholder="Titel Nederlands" maxLength={120}/><Input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})} placeholder="English title" maxLength={120}/><Textarea value={form.bodyNl} onChange={e=>setForm({...form,bodyNl:e.target.value})} placeholder="Bericht Nederlands" maxLength={1000}/><Textarea value={form.bodyEn} onChange={e=>setForm({...form,bodyEn:e.target.value})} placeholder="English message" maxLength={1000}/></div><div className="flex flex-wrap gap-2">{form.statusKey&&<Button variant="outline" onClick={()=>setForm(empty)}>{text("Annuleren","Cancel")}</Button>}<Button disabled={busy||![form.titleNl,form.titleEn,form.bodyNl,form.bodyEn].every(value=>value.trim().length>=3)} onClick={()=>void publish()}><Send className="size-4"/>{busy?text("Publiceren…","Publishing…"):form.statusKey?text("Nieuwe status publiceren","Publish new status"):text("Naar alle gebruikers publiceren","Publish to all users")}</Button></div></CardContent></Card>
    <div className="space-y-6"><Card><CardHeader><CardTitle>{text("Actuele statussen","Current statuses")}</CardTitle></CardHeader><CardContent className="space-y-3">{active.length===0?<p className="text-sm text-muted-foreground">{text("Er zijn geen actieve platformstatussen.","There are no active platform statuses.")}</p>:active.map((item:any)=><article key={item.id} className="rounded-xl border p-3"><div className="flex items-center justify-between gap-2"><Badge variant={item.severity==="critical"?"destructive":"secondary"}>{item.severity}</Badge><span className="text-xs text-muted-foreground">{new Date(item.published_at).toLocaleString(locale)}</span></div><h3 className="mt-2 font-semibold">{text(item.title_nl,item.title_en)}</h3><p className="mt-1 text-sm text-muted-foreground">{text(item.body_nl,item.body_en)}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={()=>edit(item)}><Pencil className="size-4"/>{text("Bijwerken","Update")}</Button><Button size="sm" onClick={()=>edit(item,true)}><CheckCircle2 className="size-4"/>{text("Opgelost melden","Mark resolved")}</Button></div></article>)}</CardContent></Card><Card><CardHeader><CardTitle>{text("Berichtgeschiedenis","Message history")}</CardTitle></CardHeader><CardContent className="max-h-[32rem] space-y-2 overflow-y-auto">{messages.isLoading?<p className="text-sm text-muted-foreground">{text("Laden…","Loading…")}</p>:(messages.data??[]).map((item:any)=><article key={item.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.announcement_type==="status"?text("Status","Status"):text("Update","Update")}</Badge><Badge variant="secondary">{item.severity}</Badge><time className="ml-auto text-xs text-muted-foreground">{new Date(item.published_at).toLocaleString(locale)}</time></div><p className="mt-2 text-sm font-medium">{text(item.title_nl,item.title_en)}</p></article>)}</CardContent></Card></div>
  </div>;
}
