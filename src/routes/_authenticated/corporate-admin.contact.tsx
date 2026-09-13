import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listContactMessages, updateContactMessage } from "@/lib/contact.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/contact")({ component: ContactInbox });
const statuses = ["new", "reviewing", "answered", "closed"] as const;
type Status = typeof statuses[number];
const labels: Record<Status, [string, string]> = { new: ["Nieuw", "New"], reviewing: ["In behandeling", "Reviewing"], answered: ["Beantwoord", "Answered"], closed: ["Gesloten", "Closed"] };

function ContactInbox() {
  const { text, locale } = useLocale();
  const query = useQuery({ queryKey: ["contact-messages"], queryFn: listContactMessages });
  const [filter, setFilter] = useState<Status | "all">("new");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => { const needle = search.trim().toLowerCase(); return (query.data ?? []).filter((row: any) => (filter === "all" || row.status === filter) && (!needle || `${row.name} ${row.email} ${row.subject} ${row.message}`.toLowerCase().includes(needle))); }, [query.data, filter, search]);
  const active: any = (query.data ?? []).find((row: any) => row.id === selected) ?? rows[0];
  async function change(id: string, status: Status) { setBusy(true); try { await updateContactMessage({ data: { id, status } }); await query.refetch(); toast.success(text("Status bijgewerkt.", "Status updated.")); } catch { toast.error(text("Status kon niet worden bijgewerkt.", "Status could not be updated.")); } finally { setBusy(false); } }
  return <div className="space-y-4">
    <div><h2 className="font-display text-2xl font-semibold">{text("Contactberichten", "Contact messages")}</h2><p className="mt-1 text-sm text-muted-foreground">{text("Behandel berichten die via de publieke contactpagina zijn ontvangen.", "Handle messages received through the public contact page.")}</p></div>
    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_13rem]"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={text("Zoek op naam, e-mail of inhoud…", "Search by name, email or content…")}/><select className="h-10 rounded-md border bg-background px-3" value={filter} onChange={e => setFilter(e.target.value as Status | "all")}><option value="all">{text("Alle statussen", "All statuses")}</option>{statuses.map(status => <option key={status} value={status}>{text(...labels[status])}</option>)}</select></CardContent></Card>
    {query.isLoading ? <Card><CardContent className="p-6 text-sm text-muted-foreground">{text("Berichten laden…", "Loading messages…")}</CardContent></Card> : query.isError ? <Card><CardContent className="p-6 text-sm text-destructive">{text("De contactberichten konden niet worden geladen.", "Contact messages could not be loaded.")}</CardContent></Card> : !rows.length ? <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Inbox className="size-5"/>{text("Geen berichten binnen dit filter.", "No messages in this filter.")}</CardContent></Card> : <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
      <Card><CardHeader><CardTitle className="text-base">{text("Inbox", "Inbox")} · {rows.length}</CardTitle></CardHeader><CardContent className="max-h-[38rem] space-y-2 overflow-y-auto">{rows.map((row: any) => <button key={row.id} onClick={() => setSelected(row.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${active?.id === row.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><div className="flex items-center gap-2"><strong className="min-w-0 flex-1 truncate text-sm">{row.subject}</strong><Badge variant={row.status === "new" ? "default" : "outline"}>{text(...labels[row.status as Status])}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{row.name} · {row.email}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.created_at))}</p></button>)}</CardContent></Card>
      {active && <Card><CardHeader><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><CardTitle>{active.subject}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{active.name} · {active.email}</p></div><Button asChild variant="outline" size="sm"><a href={`mailto:${encodeURIComponent(active.email)}?subject=${encodeURIComponent(`Re: ${active.subject}`)}`}><Mail className="size-4"/>{text("Beantwoorden", "Reply")}<ExternalLink className="size-3"/></a></Button></div></CardHeader><CardContent className="space-y-5"><p className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">{active.message}</p><div className="flex flex-wrap items-center gap-3"><label className="text-sm font-medium" htmlFor="contact-status">{text("Status", "Status")}</label><select id="contact-status" disabled={busy} className="h-10 rounded-md border bg-background px-3" value={active.status} onChange={e => void change(active.id, e.target.value as Status)}>{statuses.map(status => <option key={status} value={status}>{text(...labels[status])}</option>)}</select><span className="text-xs text-muted-foreground">{text("Antwoorden opent je ingestelde e-mailprogramma.", "Reply opens your configured email application.")}</span></div></CardContent></Card>}
    </div>}
  </div>;
}
