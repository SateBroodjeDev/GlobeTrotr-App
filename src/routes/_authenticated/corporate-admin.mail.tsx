import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailSignaturePreview } from "@/components/mail/MailSignaturePreview";
import {
  getCorporateBusinessData,
  getEmailDeliveryMode,
  getEmailDeliveryOverview,
  retryEmailDelivery,
  requestCorporateMailboxSync,
  retryCorporateMailboxProvisioning,
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
  mailboxType: "shared" as "shared" | "personal" | "automated",
  hostingMode: "external" as "external" | "self_hosted",
  ownerUserId: "",
  signatureText: "",
  inboundSecretRef: "",
  outboundSecretRef: "",
  active: true,
  imapHost: "mail.globetrotr.nl",
  imapPort: 993,
  imapSecure: true,
  imapUsername: "",
  imapPassword: "",
};

function Page() {
  const { text, locale } = useLocale(),
    qc = useQueryClient();
  const q = useQuery({
    queryKey: ["corporate-business"],
    queryFn: () => getCorporateBusinessData(),
    refetchInterval: 30000,
  });
  const delivery = useQuery({
    queryKey: ["email-delivery-overview"],
    queryFn: () => getEmailDeliveryOverview(),
    refetchInterval: 30000,
  });
  const deliveryMode = useQuery({
    queryKey: ["email-delivery-mode"],
    queryFn: () => getEmailDeliveryMode(),
  });
  const [f, setF] = useState(blank),
    [saving, setSaving] = useState(false),
    [hasStoredPassword, setHasStoredPassword] = useState(false),
    [retrying, setRetrying] = useState(""),
    [requestingSync, setRequestingSync] = useState(false),
    [retryingProvisioning,setRetryingProvisioning]=useState(false),
    [modeReason, setModeReason] = useState(""),
    [changingMode, setChangingMode] = useState(false);
  const initialMailboxSelected = useRef(false);
  useEffect(() => {
    if (!initialMailboxSelected.current && q.data) {
      initialMailboxSelected.current = true;
      if (q.data.mailboxes[0]) edit(q.data.mailboxes[0]);
    }
  }, [q.data]);
  function edit(m: any) {
    setHasStoredPassword(Boolean(m.credentials_updated_at));
    setF({
      id: m.id,
      address: m.address,
      displayName: m.display_name,
      mailboxType: m.mailbox_type,
      hostingMode: m.hosting_mode ?? "external",
      ownerUserId: m.owner_user_id ?? "",
      signatureText: m.signature_text ?? "",
      inboundSecretRef: m.inbound_secret_ref ?? "",
      outboundSecretRef: m.outbound_secret_ref ?? "",
      active: m.active,
      imapHost: m.imap_host ?? "mail.globetrotr.nl",
      imapPort: m.imap_port ?? 993,
      imapSecure: m.imap_secure !== false,
      imapUsername: m.imap_username ?? m.address,
      imapPassword: "",
    });
  }
  async function save() {
    if (saving) return;
    setSaving(true);
    let result: { id: string };
    try {
      result = await saveCorporateMailbox({
        data: {
          address: f.address,
          displayName: f.displayName,
          mailboxType: f.mailboxType,
          hostingMode: f.hostingMode,
          signatureText: f.signatureText,
          inboundSecretRef: f.inboundSecretRef,
          outboundSecretRef: f.outboundSecretRef,
          active: f.active,
          imapHost: f.imapHost,
          imapPort: f.imapPort,
          imapSecure: f.imapSecure,
          imapUsername: f.imapUsername,
          imapPassword: f.imapPassword,
          ...(f.id ? { id: f.id } : {}),
          ...(f.ownerUserId ? { ownerUserId: f.ownerUserId } : {}),
        },
      });
    } catch (error) {
      const code = String(error);
      toast.error(code.includes("MAILBOX_CREDENTIALS_KEY_")
        ? text("Mailbox niet opgeslagen: stel dezelfde geldige mailboxsleutel in op Node-01 en Node-02.", "Mailbox not saved: configure the same valid mailbox key on Node-01 and Node-02.")
        : text("Mailbox kon niet worden opgeslagen. Controleer de serverlog voor de foutcode.", "Mailbox could not be saved. Check the server log for the error code."));
      setSaving(false);
      return;
    }
    setF((current) => ({ ...current, id: result.id, imapPassword: "" }));
    if (f.imapPassword.trim()) setHasStoredPassword(true);
    toast.success(text("Mailbox opgeslagen.", "Mailbox saved."));
    try {
      await qc.invalidateQueries({ queryKey: ["corporate-business"] });
    } catch {
      toast.error(text("Mailbox opgeslagen, maar de lijst kon niet worden vernieuwd.", "Mailbox saved, but the list could not be refreshed."));
    } finally {
      setSaving(false);
    }
  }
  async function permission(userId: string, value: any) {
    await setCorporateMailboxMember({ data: { mailboxId: f.id, userId, permission: value } });
    await qc.invalidateQueries({ queryKey: ["corporate-business"] });
  }
  async function requestSync() {
    if (!f.id) return;
    setRequestingSync(true);
    try {
      await requestCorporateMailboxSync({ data: { mailboxId: f.id } });
      await qc.invalidateQueries({ queryKey: ["corporate-business"] });
      toast.success(text("Synchronisatie aangevraagd voor de volgende worker-ronde.", "Sync requested for the next worker cycle."));
    } catch {
      toast.error(text("Synchronisatie is al aangevraagd of dit postvak is niet actief.", "Sync is already requested or this mailbox is inactive."));
    } finally {
      setRequestingSync(false);
    }
  }
  async function retryProvisioning(){if(!f.id)return;setRetryingProvisioning(true);try{await retryCorporateMailboxProvisioning({data:{mailboxId:f.id}});await qc.invalidateQueries({queryKey:["corporate-business"]});toast.success(text("Mailboxaanmaak staat opnieuw klaar.","Mailbox provisioning is queued again."))}catch{toast.error(text("Mailboxaanmaak kon niet opnieuw worden gestart.","Mailbox provisioning could not be retried."))}finally{setRetryingProvisioning(false)}}
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
  async function changeMode() {
    if (modeReason.trim().length < 10) {
      toast.error(
        text("Geef een reden van minimaal 10 tekens.", "Enter a reason of at least 10 characters."),
      );
      return;
    }
    const next = deliveryMode.data?.mode === "live" ? "test" : "live";
    const question =
      next === "live"
        ? text(
            "Livemodus activeren en alle vastgehouden berichten vrijgeven?",
            "Enable live mode and release all held messages?",
          )
        : text(
            "Nieuwe uitgaande servicemail direct pauzeren?",
            "Pause new outgoing service email immediately?",
          );
    if (!window.confirm(question)) return;
    setChangingMode(true);
    try {
      const result = await setEmailDeliveryMode({
        data: { mode: next, releaseHeld: next === "live", reason: modeReason.trim() },
      });
      setModeReason("");
      await Promise.all([deliveryMode.refetch(), delivery.refetch()]);
      toast.success(
        next === "live"
          ? text(
              `${result.released} berichten vrijgegeven.`,
              `${result.released} messages released.`,
            )
          : text("Uitgaande servicemail gepauzeerd.", "Outgoing service email paused."),
      );
    } catch {
      toast.error(
        text("Bezorgmodus kon niet worden aangepast.", "Delivery mode could not be changed."),
      );
    } finally {
      setChangingMode(false);
    }
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
                <small>{m.mailbox_type} · {mailboxSyncLabel(m.sync_status, text)}</small>
              </button>
            ))}
            <Button variant="outline" className="w-full" onClick={() => { setF({ ...blank }); setHasStoredPassword(false); }}>
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
                    <option value="automated">{text("Automatisch reisadres", "Automated trip address")}</option>
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
              </div>
              <div className="rounded-xl border p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1" checked={f.hostingMode==="self_hosted"} onChange={e=>setF({...f,hostingMode:e.target.checked?"self_hosted":"external",imapHost:e.target.checked?"mail.globetrotr.nl":f.imapHost,imapUsername:e.target.checked?f.address:f.imapUsername})}/>
                  <span><strong className="block">{text("Host op de GlobeTrotr-mailserver","Host on the GlobeTrotr mail server")}</strong><span className="text-muted-foreground">{text("Maakt of actualiseert dit @globetrotr.nl-postvak automatisch op Node-02. Voor een automatisch reisadres wordt een sterk intern wachtwoord gegenereerd.","Creates or updates this @globetrotr.nl mailbox automatically on Node-02. An automated trip address receives a strong internal password.")}</span></span>
                </label>
              </div>
              <label className="block space-y-2">
                <Label>{text("Handtekening voor dit postvak", "Signature for this mailbox")}</Label>
                <Textarea
                  rows={6}
                  maxLength={2000}
                  value={f.signatureText}
                  onChange={(e) => setF({ ...f, signatureText: e.target.value })}
                />
              </label>
              <p className="text-xs text-muted-foreground">{text("Deze handtekening verschijnt automatisch onder uitgaande mail. Wijzig haar hier; de inbox bevat alleen berichten en concepten.", "This signature is added automatically to outgoing mail. Edit it here; the inbox only contains messages and drafts.")}</p>
              <MailSignaturePreview signatureText={f.signatureText} displayName={f.displayName} address={f.address} />
              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-medium">
                  {text("Postvak uitlezen", "Read mailbox")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={text("IMAP-server", "IMAP server")}
                    value={f.imapHost}
                    disabled={f.hostingMode==="self_hosted"}
                    set={(v) => setF({ ...f, imapHost: v })}
                  />
                  <Field
                    label={text("IMAP-gebruiker", "IMAP username")}
                    value={f.imapUsername}
                    disabled={f.hostingMode==="self_hosted"}
                    set={(v) => setF({ ...f, imapUsername: v })}
                  />
                  <label className="space-y-2">
                    <Label>{text("Poort", "Port")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={65535}
                      value={f.imapPort}
                      onChange={(e) => setF({ ...f, imapPort: Number(e.target.value) })}
                    />
                  </label>
                  <Field
                    label={text("Wachtwoord", "Password")}
                    type="password"
                    value={f.imapPassword}
                    placeholder={hasStoredPassword ? "••••••••" : undefined}
                    set={(v) => setF({ ...f, imapPassword: v })}
                  />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={f.imapSecure}
                    onChange={(e) => setF({ ...f, imapSecure: e.target.checked })}
                  />
                  {text("Versleutelde IMAP-verbinding", "Encrypted IMAP connection")}
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  {text(
                    hasStoredPassword
                      ? "•••••••• betekent dat een wachtwoord is opgeslagen. Laat dit veld leeg om het te behouden; typ een nieuw wachtwoord om het te vervangen."
                      : "Vul het IMAP-wachtwoord in om dit postvak te koppelen. Het wachtwoord wordt versleuteld opgeslagen.",
                    hasStoredPassword
                      ? "•••••••• means a password is stored. Leave this field empty to keep it, or enter a new password to replace it."
                      : "Enter the IMAP password to connect this mailbox. The password is stored encrypted.",
                  )}
                </p>
              </div>
              <Button disabled={saving || !f.address || !f.displayName} onClick={() => void save()}>
                {saving ? text("Opslaan…", "Saving…") : text("Opslaan", "Save")}
              </Button>
            </CardContent>
          </Card>
          {f.id && (() => {
            const mailbox = q.data?.mailboxes.find((item: any) => item.id === f.id);
            if (!mailbox) return null;
            return <Card><CardHeader><CardTitle>{text("Synchronisatie", "Synchronisation")}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {mailbox.hosting_mode==="self_hosted"&&<div className="space-y-2 rounded-lg border p-3"><p className="font-medium">{text("Mailserverstatus","Mail server status")}: {mailbox.provisioning_status}</p>{mailbox.provisioning_error_code&&<p className="text-destructive"><code>{mailbox.provisioning_error_code}</code></p>}<p className="text-xs text-muted-foreground">{text("De worker maakt het postvak aan via de afgeschermde beheer-API. Wachtwoorden worden niet teruggegeven.","The worker creates the mailbox through the protected management API. Passwords are never returned.")}</p>{mailbox.provisioning_status==="error"&&<Button size="sm" variant="outline" disabled={retryingProvisioning} onClick={()=>void retryProvisioning()}><RefreshCw className={`size-4 ${retryingProvisioning?"animate-spin":""}`}/>{text("Opnieuw proberen","Retry provisioning")}</Button>}</div>}
                <Badge variant={mailbox.sync_status === "error" ? "destructive" : "secondary"}>{mailboxSyncLabel(mailbox.sync_status, text)}</Badge>
                <p>{text("Laatste succesvolle ronde", "Last successful cycle")}: {formatSyncTime(mailbox.last_synced_at, locale, text)}</p>
                <p>{text("Laatste poging", "Last attempt")}: {formatSyncTime(mailbox.last_sync_attempt_at, locale, text)}</p>
                {mailbox.last_sync_error_code && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"><p className="break-all">{text("Foutcode", "Error code")}: <code>{mailbox.last_sync_error_code}</code></p><p className="mt-1 text-xs">{mailboxErrorHint(mailbox.last_sync_error_code, text)}</p></div>}
                {mailbox.sync_requested_at && <p className="text-muted-foreground">{text("Een nieuwe ronde staat klaar.", "A new cycle is queued.")}</p>}
                <Button variant="outline" disabled={requestingSync || !mailbox.active || Boolean(mailbox.sync_requested_at) || mailbox.sync_status === "syncing"} onClick={() => void requestSync()}>
                  <RefreshCw className="mr-2 size-4" />{text("Opnieuw synchroniseren", "Synchronise again")}
                </Button>
                <p className="text-xs text-muted-foreground">{text("De worker probeert dit postvak in de volgende ronde opnieuw. Er wordt geen extra mail verstuurd.", "The worker retries this mailbox in the next cycle. No additional email is sent.")}</p>
              </CardContent></Card>;
          })()}
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
            <Badge variant={deliveryMode.data?.mode === "live" ? "default" : "secondary"}>
              {deliveryMode.data?.mode === "live"
                ? text("Live", "Live")
                : text("Gepauzeerd", "Paused")}
            </Badge>
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
            <label className="min-w-0 flex-1 space-y-2">
              <Label>{text("Reden voor wijziging", "Reason for change")}</Label>
              <Input
                maxLength={300}
                value={modeReason}
                onChange={(event) => setModeReason(event.target.value)}
                placeholder={text(
                  "Bijvoorbeeld: relay succesvol getest",
                  "For example: relay tested successfully",
                )}
              />
            </label>
            <Button
              variant={deliveryMode.data?.mode === "live" ? "destructive" : "default"}
              disabled={changingMode || deliveryMode.isLoading}
              onClick={() => void changeMode()}
            >
              {deliveryMode.data?.mode === "live"
                ? text("Verzending pauzeren", "Pause delivery")
                : text("Livemodus activeren", "Enable live mode")}
            </Button>
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
function mailboxSyncLabel(status: string, text: (nl: string, en: string) => string) {
  return ({ not_configured: text("Niet ingesteld", "Not configured"), ready: text("Gereed", "Ready"), syncing: text("Bezig", "Syncing"), error: text("Fout", "Error"), disabled: text("Uitgeschakeld", "Disabled") } as Record<string, string>)[status] ?? status;
}
function mailboxErrorHint(code: string, text: (nl: string, en: string) => string) {
  const hints: Record<string, [string, string]> = {
    IMAP_AUTH_FAILED: ["Controleer postvakadres en IMAP-wachtwoord.", "Check the mailbox address and IMAP password."],
    IMAP_TLS_FAILED: ["Controleer certificaat, servernaam en TLS-instellingen.", "Check the certificate, server name and TLS settings."],
    IMAP_TIMEOUT: ["De mailserver reageerde niet op tijd; controleer de verbinding.", "The mail server did not respond in time; check connectivity."],
    IMAP_UNREACHABLE: ["De mailserver is niet bereikbaar; controleer host en netwerk.", "The mail server is unreachable; check the host and network."],
    IMAP_STORAGE_ERROR: ["De opslag is tijdelijk niet beschikbaar; probeer later opnieuw.", "Storage is temporarily unavailable; try again later."],
    MALWARE_SCANNER_UNAVAILABLE: ["De bijlagenscanner is niet beschikbaar; herstel deze op Node-02.", "The attachment scanner is unavailable; restore it on Node-02."],
  };
  return text(...(hints[code] ?? ["Bekijk de privacyveilige IMAP-workerlog op Node-02.", "Check the privacy-safe IMAP worker log on Node-02."]));
}
function formatSyncTime(value: string | null, locale: string, text: (nl: string, en: string) => string) {
  if (!value) return text("Nog niet", "Not yet");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? text("Onbekend", "Unknown") : new Intl.DateTimeFormat(locale === "en-GB" ? "en-GB" : "nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(date);
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
function Field({
  label,
  value,
  set,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => set(e.target.value)} />
    </label>
  );
}
