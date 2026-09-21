import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Download, FileText, RefreshCcw, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metric } from "@/lib/corporate-admin-ui";
import { getCorporateFinanceData, getPaddleTransactionDiagnosis, refundPaddleTransaction, retryPaddleWebhook } from "@/lib/corporate-business.functions";
import { toast } from "sonner";
import { csvCell } from "@/lib/exporters";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/finance")({ component: Page });

function exportCsv(name: string, rows: unknown[][]) {
  const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

function Page() {
  const { text, locale } = useLocale();
  const [days, setDays] = useState(30);
  const { data, refetch } = useQuery({ queryKey: ["corporate-finance", days], queryFn: () => getCorporateFinanceData({ data: { days } }) });
  const money = (minor: number, currency = "EUR") => new Intl.NumberFormat(locale, { style: "currency", currency }).format((minor || 0) / 100);
  const max = Math.max(1, ...(data?.dailyRevenue ?? []).map((item: any) => item.totalMinor));
  const exportInvoices = () => exportCsv("globetrotr-invoices", [["invoice_number", "customer", "status", "currency", "subtotal_minor", "tax_minor", "total_minor", "issued_at", "provider"], ...(data?.invoices ?? []).map((x: any) => [x.invoice_number, x.customer_name, x.status, x.currency, x.subtotal_minor, x.tax_minor, x.total_minor, x.issued_at, x.external_provider])]);
  const exportRevenue = () => exportCsv("globetrotr-revenue", [["date", "net_revenue_minor"], ...(data?.dailyRevenue ?? []).map((x: any) => [x.date, x.totalMinor])]);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">{text("Financiële bedrijfsvoering", "Financial operations")}</h2><p className="text-sm text-muted-foreground">{text("Paddle is de gezaghebbende bron voor abonnementen, betalingen, facturen en terugbetalingen.", "Paddle is the authoritative source for subscriptions, payments, invoices and refunds.")}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!data?.dailyRevenue.length} onClick={exportRevenue}><Download className="size-4"/>{text("Omzet CSV", "Revenue CSV")}</Button><Button variant="outline" disabled={!data?.invoices.length} onClick={exportInvoices}><Download className="size-4"/>{text("Facturen CSV", "Invoices CSV")}</Button><select className="h-10 rounded-md border bg-background px-3" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={30}>30 {text("dagen", "days")}</option><option value={90}>90 {text("dagen", "days")}</option><option value={365}>1 {text("jaar", "year")}</option></select></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={TrendingUp} label="MRR" value={money(data?.metrics.mrrMinor ?? 0)} detail={`${data?.metrics.activeSubscriptions ?? 0} ${text("actieve abonnementen", "active subscriptions")}`}/><Metric icon={CircleDollarSign} label={text("Netto omzet", "Net revenue")} value={money(data?.metrics.revenueMinor ?? 0)} detail={`${days} ${text("dagen", "days")}`}/><Metric icon={RefreshCcw} label={text("Terugbetaald", "Refunded")} value={money(data?.metrics.refundedMinor ?? 0)} detail={`${data?.metrics.pastDue ?? 0} past due`}/><Metric icon={FileText} label={text("Webhookwachtrij", "Webhook queue")} value={data?.metrics.pendingWebhooks}/></section>
    <Card><CardHeader><CardTitle>{text("Omzetontwikkeling", "Revenue trend")}</CardTitle></CardHeader><CardContent>{data?.dailyRevenue.length ? <div className="flex h-44 items-end gap-1" aria-label={text("Omzetgrafiek", "Revenue chart")}>{data.dailyRevenue.map((x: any) => <div key={x.date} title={`${x.date}: ${money(x.totalMinor)}`} className="min-w-1 flex-1 rounded-t bg-primary/75" style={{ height: `${Math.max(3, x.totalMinor / max * 100)}%` }}/>)}</div> : <p className="text-sm text-muted-foreground">{text("Nog geen betaaltransacties in deze periode.", "No payment transactions in this period yet.")}</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Verkoopfacturen", "Sales invoices")}</CardTitle></CardHeader><CardContent className="space-y-2">{!data?.invoices.length ? <p className="text-sm text-muted-foreground">{text("Nog geen door Paddle gesynchroniseerde facturen.", "No Paddle-synchronised invoices yet.")}</p> : data.invoices.map((x: any) => <details key={x.id} className="rounded-xl border p-4"><summary className="grid cursor-pointer gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"><span><strong className="block">{x.invoice_number}</strong><small className="text-muted-foreground">{x.customer_name}</small></span><Badge variant={x.status === "paid" ? "secondary" : x.status === "past_due" ? "destructive" : "outline"}>{x.status}</Badge><strong>{money(x.total_minor, x.currency)}</strong></summary><dl className="mt-4 grid gap-2 border-t pt-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Subtotal</dt><dd>{money(x.subtotal_minor, x.currency)}</dd></div><div><dt className="text-muted-foreground">Tax</dt><dd>{money(x.tax_minor, x.currency)}</dd></div><div><dt className="text-muted-foreground">Provider</dt><dd>{x.external_provider}</dd></div></dl></details>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>{text("Paddle-transacties", "Paddle transactions")}</CardTitle></CardHeader><CardContent className="space-y-2">{!data?.transactions?.length ? <p className="text-sm text-muted-foreground">{text("Nog geen transacties.", "No transactions yet.")}</p> : data.transactions.map((x: any) => <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><strong>{money(x.total_minor,x.currency)}</strong><p className="text-xs text-muted-foreground">{x.provider_transaction_id} · {new Date(x.occurred_at).toLocaleString(locale)}</p></div><div className="flex items-center gap-2"><Badge variant={x.status==="past_due"?"destructive":"outline"}>{x.status}</Badge>{x.status==="completed"&&Number(x.refunded_minor||0)===0&&<Button size="sm" variant="outline" onClick={async()=>{const reason=window.prompt(text("Reden voor volledige terugbetaling (minimaal 10 tekens)","Reason for full refund (at least 10 characters)"));if(!reason)return;try{const result=await refundPaddleTransaction({data:{transactionId:x.provider_transaction_id,reason}});toast.success(text(`Terugbetaling aangevraagd: ${result.status}`,`Refund requested: ${result.status}`));await refetch()}catch{toast.error(text("Terugbetaling kon niet worden aangevraagd.","Refund could not be requested."))}}}>{text("Volledig terugbetalen","Full refund")}</Button>}</div></div>)}</CardContent></Card>
    <PaddleTransactionDiagnosis onReprocessed={() => void refetch()} />
    {!!data?.webhooks?.length&&<Card><CardHeader><CardTitle>{text("Webhookacties nodig","Webhook actions required")}</CardTitle></CardHeader><CardContent className="space-y-2">{data.webhooks.map((x:any)=><div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><strong>{x.event_type}</strong><p className="text-xs text-muted-foreground">{x.provider_event_id} · {x.last_error_code||x.status}</p></div>{x.status==="failed"&&<Button size="sm" variant="outline" onClick={async()=>{const reason=window.prompt(text("Waarom verwerk je dit event opnieuw?","Why are you retrying this event?"));if(!reason)return;try{await retryPaddleWebhook({data:{eventId:x.provider_event_id,reason}});toast.success(text("Webhook opnieuw verwerkt.","Webhook processed again."));await refetch()}catch{toast.error(text("Webhook kon niet opnieuw worden verwerkt.","Webhook could not be processed again."))}}}><RefreshCcw className="size-4"/>{text("Opnieuw verwerken","Retry")}</Button>}</div>)}</CardContent></Card>}
  </div>;
}

function PaddleTransactionDiagnosis({ onReprocessed }: { onReprocessed: () => void }) {
  const { text, locale } = useLocale();
  const [id, setId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const diagnosisText: Record<string, [string, string]> = {
    not_recorded: ["Geen lokale betaaltransactie gevonden. Controleer het Paddle-event en de webhookontvangst.", "No local payment transaction was found. Check the Paddle event and webhook delivery."],
    not_paid: ["De lokale transactie is nog niet als betaald geregistreerd.", "The local transaction is not recorded as paid yet."],
    webhook_failed: ["Een bijbehorende webhook is mislukt. Controleer de foutcode voordat je opnieuw verwerkt.", "A related webhook failed. Check the error code before retrying."],
    missing_entitlement: ["Betaling geregistreerd, maar de eenmalige toegang ontbreekt.", "Payment recorded, but one-time access is missing."],
    entitlement_expired: ["De eenmalige toegang is verlopen.", "The one-time access has expired."],
    subscription_missing: ["Betaling geregistreerd, maar er is geen actief lokaal abonnement.", "Payment recorded, but no active local subscription exists."],
    workspace_mismatch: ["Het opgeslagen workspaceplan komt niet overeen met de geregistreerde toegang.", "The stored workspace plan does not match the recorded access."],
    workspace_conflict: ["De Paddle-eventkoppeling wijst naar een andere workspace dan de klantregistratie. Verwerk niet opnieuw voordat dit is onderzocht.", "The Paddle event points to a different workspace than the customer record. Do not retry before investigating."],
    active: ["Betaling, toegang en workspaceplan komen lokaal overeen.", "Payment, access and workspace plan match locally."],
  };
  async function diagnose() {
    setLoading(true);
    setResult(null);
    try { setResult(await getPaddleTransactionDiagnosis({ data: { transactionId: id.trim() } })); }
    catch { toast.error(text("Transactie kon niet worden onderzocht.", "Could not diagnose this transaction.")); }
    finally { setLoading(false); }
  }
  async function retry(eventId: string) {
    const reason = window.prompt(text("Waarom verwerk je dit event opnieuw? Minimaal 10 tekens.", "Why are you retrying this event? At least 10 characters."));
    if (!reason) return;
    try {
      await retryPaddleWebhook({ data: { eventId, reason } });
      toast.success(text("Webhook gecontroleerd opnieuw verwerkt.", "Webhook safely reprocessed."));
      await diagnose();
      onReprocessed();
    } catch { toast.error(text("Herverwerking is geweigerd of mislukt.", "Reprocessing was rejected or failed.")); }
  }
  const retryable = result?.state !== "workspace_conflict" && result?.events?.find((event: any) =>
    event.status === "failed" || (result.billingMode === "one_time" && result.state === "missing_entitlement" && event.type === "transaction.completed" && event.status === "processed"));
  return <Card><CardHeader><CardTitle>{text("Betaling en account controleren", "Check payment and account")}</CardTitle>
    <p className="text-sm text-muted-foreground">{text("Zoek op exact Paddle-transactie-ID. Dit overzicht wijzigt geen abonnement of account.", "Search by exact Paddle transaction ID. This view does not change any subscription or account.")}</p></CardHeader>
    <CardContent className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><input className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" aria-label={text("Paddle-transactie-ID", "Paddle transaction ID")} placeholder="txn_…" value={id} onChange={e => setId(e.target.value)} /><Button disabled={loading || !/^txn_[a-z0-9]{10,}$/i.test(id.trim())} onClick={() => void diagnose()}>{text("Diagnoseer", "Diagnose")}</Button></div>
    {result && <div className="space-y-3 rounded-xl border p-4 text-sm"><Badge variant={result.state === "active" ? "secondary" : "destructive"}>{text(...(diagnosisText[result.state] ?? ["Onbekende status", "Unknown state"]))}</Badge>
      <div className="grid gap-2 sm:grid-cols-2"><p>{text("Betaalstatus", "Payment status")}: <strong>{result.transaction?.status ?? "—"}</strong></p><p>{text("Betalingswijze", "Billing mode")}: <strong>{result.billingMode ?? "—"}</strong></p><p>{text("Verwacht plan", "Expected plan")}: <strong>{result.expectedPlan ?? "—"}</strong></p><p>{text("Workspaceplan", "Workspace plan")}: <strong>{result.workspace?.plan ?? "—"}</strong></p><p>{text("Accounteigenaar", "Account owner")}: <strong>{result.workspace?.ownerEmail ?? "—"}</strong></p><p>{text("Paddle-klant", "Paddle customer")}: <strong>{result.customer?.id ?? "—"}</strong></p></div>
      {result.subscription && <p>{text("Abonnement", "Subscription")}: {result.subscription.status} · {result.subscription.plan}</p>}
      {result.entitlement && <p>{text("Eenmalige toegang tot", "One-time access until")}: {new Date(result.entitlement.ends_at).toLocaleString(locale)}</p>}
      <div className="space-y-1">{result.events.map((event: any) => <p key={event.eventId} className="break-all text-xs text-muted-foreground">{event.type} · {event.status} · {event.eventId}{event.errorCode ? ` · ${event.errorCode}` : ""}</p>)}</div>
      {retryable && <Button size="sm" variant="outline" onClick={() => void retry(retryable.eventId)}><RefreshCcw className="mr-2 size-4" />{text("Dit event opnieuw verwerken", "Reprocess this event")}</Button>}
    </div>}</CardContent></Card>;
}
