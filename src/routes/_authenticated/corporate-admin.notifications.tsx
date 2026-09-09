import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { publishPlatformAnnouncement } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/notifications")({
  component: PlatformNotifications,
});

function PlatformNotifications() {
  const { text } = useLocale();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: "status" as "status" | "update", severity: "info" as "info" | "warning" | "critical" | "resolved", titleNl: "", titleEn: "", bodyNl: "", bodyEn: "" });
  async function publish() {
    if (!confirm(text("Dit bericht nu naar alle ingelogde gebruikers sturen?", "Send this message to all signed-in users now?"))) return;
    setBusy(true);
    try {
      await publishPlatformAnnouncement({ data: form });
      setForm({ ...form, titleNl: "", titleEn: "", bodyNl: "", bodyEn: "" });
      toast.success(text("Platformbericht gepubliceerd.", "Platform message published."));
    } catch { toast.error(text("Platformbericht kon niet worden gepubliceerd.", "Platform message could not be published.")); }
    finally { setBusy(false); }
  }
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="size-5"/>{text("Platformbericht publiceren","Publish platform message")}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{text("Gebruik dit voor een actuele storing, herstelmelding of belangrijke productupdate. Publiceren stuurt één persistente melding naar ieder bevestigd account.","Use this for a current incident, recovery notice or important product update. Publishing sends one persistent notification to every confirmed account.")}</p><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">{text("Soort","Type")}<select className="block h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={e=>setForm({...form,type:e.target.value as typeof form.type})}><option value="status">{text("Actuele platformstatus","Current platform status")}</option><option value="update">{text("Belangrijke update","Important update")}</option></select></label><label className="space-y-1 text-sm">{text("Ernst","Severity")}<select className="block h-10 w-full rounded-md border bg-background px-3" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as typeof form.severity})}><option value="info">Info</option><option value="warning">{text("Waarschuwing","Warning")}</option><option value="critical">{text("Kritiek","Critical")}</option><option value="resolved">{text("Opgelost","Resolved")}</option></select></label><Input value={form.titleNl} onChange={e=>setForm({...form,titleNl:e.target.value})} placeholder="Titel Nederlands" maxLength={120}/><Input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})} placeholder="English title" maxLength={120}/><Textarea value={form.bodyNl} onChange={e=>setForm({...form,bodyNl:e.target.value})} placeholder="Bericht Nederlands" maxLength={1000}/><Textarea value={form.bodyEn} onChange={e=>setForm({...form,bodyEn:e.target.value})} placeholder="English message" maxLength={1000}/></div><Button disabled={busy||!form.titleNl.trim()||!form.titleEn.trim()||!form.bodyNl.trim()||!form.bodyEn.trim()} onClick={()=>void publish()}><Send className="size-4"/>{busy?text("Publiceren…","Publishing…"):text("Naar alle gebruikers publiceren","Publish to all users")}</Button></CardContent></Card>;
}
