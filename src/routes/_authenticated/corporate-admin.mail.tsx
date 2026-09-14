import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCorporateBusinessData,
  getEmailDeliveryMode,
  getEmailDeliveryOverview,
  retryEmailDelivery,
  saveCorporateMailbox,
  setCorporateMailboxMember,
  setEmailDeliveryMode,
} from "@/lib/corporate-business.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/mail")({ component: Page });
const blank = {
  id: "",
  address: "",
  displayName: "",
  mailboxType: "shared" as "shared" | "personal",
  ownerUserId: "",
  signatureText: "",
  inboundSecretRef: "",
  outboundSecretRef: "",
  active: true,
};

function Page() {
  const { text } = useLocale(),
    qc = useQueryClient();
  const q = useQuery({
    queryKey: ["corporate-business"],
    queryFn: () => getCorporateBusinessData(),
  });
  const delivery = useQuery({
    queryKey: ["email-delivery-overview"],
    queryFn: () => getEmailDeliveryOverview(),
    refetchInterval: 30000,
  });
  const deliveryMode = useQuery({queryKey:["email-delivery-mode"],queryFn:()=>getEmailDeliveryMode()});
  const [f, setF] = useState(blank),
    [retrying, setRetrying] = useState(""),
    [modeReason,setModeReason]=useState(""),
    [changingMode,setChangingMode]=useState(false);
  useEffect(() => {
    if (!f.id && q.data?.mailboxes[0]) edit(q.data.mailboxes[0]);
  }, [q.data, f.id]);
  function edit(m: any) {
    setF({
      id: m.id,
      address: m.address,
      displayName: m.display_name,
      mailboxType: m.mailbox_type,
      ownerUserId: m.owner_user_id ?? "",
      signatureText: m.signature_text ?? "",
      inboundSecretRef: m.inbound_secret_ref ?? "",
      outboundSecretRef: m.outbound_secret_ref ?? "",
      active: m.active,
    });
  }
  async function save() {
    try {
      await saveCorporateMailbox({
        data: {
          address:f.address,displayName:f.displayName,mailboxType:f.mailboxType,
          signatureText:f.signatureText,inboundSecretRef:f.inboundSecretRef,
          outboundSecretRef:f.outboundSecretRef,active:f.active,
          ...(f.id?{id:f.id}:{}),...(f.ownerUserId?{ownerUserId:f.ownerUserId}:{}),
        },
      });
      await qc.invalidateQueries({ queryKey: ["corporate-business"] });
      toast.success(text("Mailbox opgeslagen.", "Mailbox saved."));
    } catch {
      toast.error(text("Mailbox kon niet worden opgeslagen.", "Mailbox could not be saved."));
    }
  }
  async function permission(userId: string, value: any) {
    await setCorporateMailboxMember({ data: { mailboxId: f.id, userId, permission: value } });
    await qc.invalidateQueries({ queryKey: ["corporate-business"] });
  }
  async function retry(id: string) {
    setRetrying(id);
    try {
      await retryEmailDelivery({ data: { id } });
      await delivery.refetch();
      toast.success(
        text("Bericht staat opnieuw klaar voor verzending.", "Message queued for delivery again."),
      );
    } catch {
      toast.error(
        text(
          "Dit bericht kon niet opnieuw worden klaargezet.",
          "This message could not be queued again.",
        ),
      );
    } finally {
      setRetrying("");
    }
  }
  async function changeMode(){
    if(modeReason.trim().length<10){toast.error(text("Geef een reden van minimaal 10 tekens.","Enter a reason of at least 10 characters."));return}
    const next=deliveryMode.data?.mode==="live"?"test":"live";
    const question=next==="live"?text("Livemodus activeren en alle vastgehouden berichten vrijgeven?","Enable live mode and release all held messages?"):text("Nieuwe uitgaande servicemail direct pauzeren?","Pause new outgoing service email immediately?");
    if(!window.confirm(question))return;
    setChangingMode(true);
    try{const result=await setEmailDeliveryMode({data:{mode:next,releaseHeld:next==="live",reason:modeReason.trim()}});setModeReason("");await Promise.all([deliveryMode.refetch(),delivery.refetch()]);toast.success(next==="live"?text(`${result.released} berichten vrijgegeven.`,`${result.released} messages released.`):text("Uitgaande servicemail gepauzeerd.","Outgoing service email paused."))}catch{toast.error(text("Bezorgmodus kon niet worden aangepast.","Delivery mode could not be changed."))}finally{setChangingMode(false)}
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Inbox className="size-5" />
              {text("Bedrijfsmail", "Company mail")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.data?.mailboxes.map((m: any) => (
              <button
                key={m.id}
                onClick={() => edit(m)}
                className="w-full rounded-xl border p-3 text-left"
              >
                <strong className="block truncate">{m.address}</strong>
                <small>
                  {m.mailbox_type} · {m.sync_status}
                </small>
              </button>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setF(blank)}>
              {text("Toevoegen", "Add")}
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{f.address || text("Nieuwe mailbox", "New mailbox")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                {text(
                  "SMTP-verzending loopt via de beveiligde relay op Node-02. IMAP-inboxsync wordt apart geactiveerd.",
                  "SMTP delivery runs through the protected relay on Node-02. IMAP inbox sync is activated separately.",
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={text("E-mailadres", "Email address")}
                  value={f.address}
                  set={(v) => setF({ ...f, address: v })}
                />
                <Field
                  label={text("Naam", "Name")}
                  value={f.displayName}
                  set={(v) => setF({ ...f, displayName: v })}
                />
                <label className="space-y-2">
                  <Label>{text("Soort", "Type")}</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3"
                    value={f.mailboxType}
                    onChange={(e) => setF({ ...f, mailboxType: e.target.value as any })}
                  >
                    <option value="shared">{text("Gedeeld", "Shared")}</option>
                    <option value="personal">{text("Persoonlijk", "Personal")}</option>
                  </select>
                </label>
                {f.mailboxType === "personal" && (
                  <label className="space-y-2">
                    <Label>{text("Eigenaar", "Owner")}</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3"
                      value={f.ownerUserId}
                      onChange={(e) => setF({ ...f, ownerUserId: e.target.value })}
                    >
                      <option value="">—</option>
                      {q.data?.people.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Field
                  label="IMAP secret reference"
                  value={f.inboundSecretRef}
                  set={(v) => setF({ ...f, inboundSecretRef: v })}
                />
                <Field
                  label="SMTP secret reference"
                  value={f.outboundSecretRef}
                  set={(v) => setF({ ...f, outboundSecretRef: v })}
                />
              </div>
              <label className="block space-y-2">
                <Label>{text("Handtekening", "Signature")}</Label>
                <Textarea
                  rows={6}
                  maxLength={2000}
                  value={f.signatureText}
                  onChange={(e) => setF({ ...f, signatureText: e.target.value })}
                />
              </label>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" />
                {text(
                  "Alleen secret-namen; nooit wachtwoorden of tokens.",
                  "Secret names only; never passwords or tokens.",
                )}
              </p>
              <Button disabled={!f.address || !f.displayName} onClick={() => void save()}>
                {text("Opslaan", "Save")}
              </Button>
            </CardContent>
          </Card>
          {f.id && (
            <Card>
              <CardHeader>
                <CardTitle>{text("Mailboxrechten", "Mailbox permissions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.data?.people.map((p: any) => {
                  const value =
                    (q.data.mailboxMembers ?? []).find(
                      (m: any) => m.mailbox_id === f.id && m.user_id === p.id,
                    )?.permission ?? "none";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    >
                      <span>{p.name}</span>
                      <select
                        className="rounded-md border bg-background p-1"
                        value={value}
                        onChange={(e) => void permission(p.id, e.target.value)}
                      >
                        <option value="none">{text("Geen", "None")}</option>
                        <option value="read">{text("Lezen", "Read")}</option>
                        <option value="reply">{text("Antwoorden", "Reply")}</option>
                        <option value="manage">{text("Beheren", "Manage")}</option>
                      </select>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5" />
            {text("Bezorging van servicemail", "Service email delivery")}
            <Badge variant={deliveryMode.data?.mode==="live"?"default":"secondary"}>{deliveryMode.data?.mode==="live"?text("Live","Live"):text("Gepauzeerd","Paused")}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {text(
              "De laatste 100 berichten. Het overzicht ververst iedere 30 seconden.",
              "The latest 100 messages. This overview refreshes every 30 seconds.",
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 space-y-2"><Label>{text("Reden voor wijziging","Reason for change")}</Label><Input maxLength={300} value={modeReason} onChange={event=>setModeReason(event.target.value)} placeholder={text("Bijvoorbeeld: relay succesvol getest","For example: relay tested successfully")}/></label>
            <Button variant={deliveryMode.data?.mode==="live"?"destructive":"default"} disabled={changingMode||deliveryMode.isLoading} onClick={()=>void changeMode()}>{deliveryMode.data?.mode==="live"?text("Verzending pauzeren","Pause delivery"):text("Livemodus activeren","Enable live mode")}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(delivery.data?.counts ?? {}).map(([status, count]) => (
              <Badge key={status} variant={status === "failed" ? "destructive" : "secondary"}>
                {deliveryLabel(status, text)}: {String(count)}
              </Badge>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">{text("Ontvanger", "Recipient")}</th>
                  <th>{text("Soort", "Type")}</th>
                  <th>Status</th>
                  <th>{text("Pogingen", "Attempts")}</th>
                  <th>{text("Aangemaakt", "Created")}</th>
                  <th>
                    <span className="sr-only">{text("Actie", "Action")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {delivery.data?.messages.map((message: any) => (
                  <tr key={message.id} className="border-t">
                    <td className="max-w-64 truncate py-3">{message.recipient_email}</td>
                    <td>{message.template_key}</td>
                    <td>
                      <Badge variant={message.status === "failed" ? "destructive" : "outline"}>
                        {deliveryLabel(message.status, text)}
                      </Badge>
                      {message.last_error_code && (
                        <p
                          className="mt-1 max-w-52 truncate text-xs text-destructive"
                          title={message.last_error_code}
                        >
                          {message.last_error_code}
                        </p>
                      )}
                    </td>
                    <td>{message.attempts}</td>
                    <td>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(message.created_at))}
                    </td>
                    <td className="text-right">
                      {message.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={retrying === message.id}
                          onClick={() => void retry(message.id)}
                        >
                          <RefreshCw
                            className={`size-4 ${retrying === message.id ? "animate-spin" : ""}`}
                          />
                          {text("Opnieuw", "Retry")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {delivery.data && !delivery.data.messages.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {text(
                  "Er zijn nog geen servicemails verwerkt.",
                  "No service emails have been processed yet.",
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function deliveryLabel(status: string, text: (nl: string, en: string) => string) {
  return (
    (
      {
        held: text("Vastgehouden", "Held"),
        pending: text("In wachtrij", "Queued"),
        processing: text("Wordt verzonden", "Sending"),
        sent: text("Verzonden", "Sent"),
        failed: text("Mislukt", "Failed"),
        cancelled: text("Geannuleerd", "Cancelled"),
      } as Record<string, string>
    )[status] ?? status
  );
}
function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
}
