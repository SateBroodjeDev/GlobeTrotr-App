import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { csvCell } from "@/lib/exporters";
import { getCorporateAdminData } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/audit")({ component: AuditPage });

function download(entries: any[]) {
  const rows = [["timestamp", "actor", "email", "action", "target_type", "target_id", "result"], ...entries.map((e) => [e.created_at, e.actorName, e.actorEmail, e.action, e.target_type, e.target_id, e.result])];
  const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `globetrotr-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AuditPage() {
  const { text } = useLocale();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState("all");
  const [all, setAll] = useState(false);
  const query = useQuery({ queryKey: ["corporate-admin-data"], queryFn: () => getCorporateAdminData() });
  const entries = useMemo(() => (query.data?.auditLog ?? []).filter((entry: any) => {
    const haystack = [entry.actorName, entry.actorEmail, entry.action, entry.target_type, entry.target_id].join(" ").toLowerCase();
    return (result === "all" || entry.result === result) && haystack.includes(search.trim().toLowerCase());
  }), [query.data, result, search]);
  return <Card>
    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><CardTitle>Auditlog</CardTitle><p className="mt-1 text-sm text-muted-foreground">{text("Zoek wie welke beheeractie uitvoerde en exporteer het huidige resultaat.", "Find who performed each administrative action and export the current result.")}</p></div>
      <Button variant="outline" disabled={!entries.length} onClick={() => download(entries)}><Download className="size-4" />CSV</Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text("Zoek beheerder, actie of doel", "Search administrator, action or target")}/></label>
        <select className="h-10 rounded-md border bg-background px-3" value={result} onChange={(e) => setResult(e.target.value)}><option value="all">{text("Alle resultaten", "All results")}</option><option value="success">{text("Geslaagd", "Success")}</option><option value="failed">{text("Mislukt", "Failed")}</option></select>
      </div>
      {entries.slice(0, all ? entries.length : 20).map((entry: any) => <div key={entry.id} className="grid gap-1 rounded-lg border px-3 py-2 text-xs sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto] sm:items-center"><div className="min-w-0"><strong className="block truncate">{entry.actorName || text("Onbekende beheerder", "Unknown administrator")}</strong><span className="block truncate text-muted-foreground">{entry.actorEmail || entry.actor_user_id}</span></div><div className="flex min-w-0 flex-wrap items-center gap-2"><Badge variant={entry.result === "success" ? "secondary" : "destructive"}>{entry.result === "success" ? text("Geslaagd", "Success") : text("Mislukt", "Failed")}</Badge><strong>{entry.action}</strong>{entry.target_type && <span>{entry.target_type}</span>}{entry.target_id && <span className="font-mono text-muted-foreground">{String(entry.target_id).slice(0, 20)}</span>}</div><time className="text-muted-foreground sm:text-right">{new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.created_at))}</time></div>)}
      {!entries.length && <p className="py-8 text-center text-sm text-muted-foreground">{text("Geen activiteiten gevonden.", "No activity found.")}</p>}
      {entries.length > 20 && <Button variant="outline" onClick={() => setAll((value) => !value)}>{all ? text("Minder tonen", "Show less") : text(`Alle ${entries.length} tonen`, `Show all ${entries.length}`)}</Button>}
    </CardContent>
  </Card>;
}
