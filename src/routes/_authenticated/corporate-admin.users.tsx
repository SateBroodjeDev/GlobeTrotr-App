import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/lib/corporate-admin-ui";
import { getCorporateAdminData, updatePlatformUser } from "@/lib/issues.functions";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/corporate-admin/users")({ component: UsersPage });

function UsersPage() {
  const { text } = useLocale();
  const query = useQuery({ queryKey: ["corporate-admin-data"], queryFn: () => getCorporateAdminData() });
  const [search, setSearch] = useState("");
  const [all, setAll] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [reason, setReason] = useState("");
  const users = (query.data?.users ?? []).filter((user: any) => `${user.displayName} ${user.email}`.toLowerCase().includes(search.toLowerCase()));

  async function save() {
    try {
      await updatePlatformUser({ data: { userId: edit.id, displayName: edit.displayName, locale: edit.locale, plan: edit.plan, reason } });
      setEdit(null); setReason(""); await query.refetch();
      toast.success(text("Gebruiker bijgewerkt.", "User updated."));
    } catch {
      toast.error(text("Controleer de gegevens en vul een reden van minimaal 10 tekens in.", "Check the data and provide a reason of at least 10 characters."));
    }
  }

  return <Card><CardHeader><CardTitle>{text("Gebruikers", "Users")}</CardTitle></CardHeader><CardContent className="space-y-4">
    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Zoek op naam of e-mailadres…", "Search by name or email…")} />
    {users.slice(0, all ? users.length : 8).map((user: any) => <div key={user.id} className="rounded-xl border p-4">{edit?.id === user.id ? <div className="grid gap-3 sm:grid-cols-2">
      <Field label={text("Profielnaam", "Profile name")}><Input value={edit.displayName} maxLength={100} onChange={(event) => setEdit({ ...edit, displayName: event.target.value })} /></Field>
      <Field label={text("Abonnement", "Plan")}><select className="h-10 rounded-md border bg-background px-3" value={edit.plan} onChange={(event) => setEdit({ ...edit, plan: event.target.value })}>{["free", "pro", "agency"].map((plan) => <option key={plan}>{plan}</option>)}</select></Field>
      <Field label={text("Taal", "Language")}><select className="h-10 rounded-md border bg-background px-3" value={edit.locale} onChange={(event) => setEdit({ ...edit, locale: event.target.value })}><option value="nl-NL">Nederlands</option><option value="en-GB">English</option></select></Field>
      <Field label={text("Reden", "Reason")}><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={text("Minimaal 10 tekens", "At least 10 characters")} /></Field>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={!edit.displayName.trim() || reason.trim().length < 10} onClick={() => void save()}>{text("Opslaan", "Save")}</Button><Button variant="outline" onClick={() => setEdit(null)}>{text("Annuleren", "Cancel")}</Button></div>
    </div> : <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1"><strong className="block truncate">{user.displayName || text("Naamloos account", "Unnamed account")}</strong><span className="block truncate text-xs text-muted-foreground">{user.email}</span></div>
      <Badge variant="outline">{user.plan}</Badge><Badge variant={user.emailConfirmed ? "secondary" : "outline"}>{user.emailConfirmed ? text("Bevestigd", "Confirmed") : text("Onbevestigd", "Unconfirmed")}</Badge>
      <Button size="sm" variant="outline" asChild><Link to="/corporate-admin/user/$userId" params={{ userId: user.id }}><Eye className="size-4" />{text("Details", "Details")}</Link></Button>
      <Button size="sm" variant="outline" onClick={() => { setEdit({ ...user }); setReason(""); }}><Pencil className="size-4" />{text("Bewerken", "Edit")}</Button>
    </div>}</div>)}
    {users.length > 8 && <Button variant="outline" onClick={() => setAll((value) => !value)}>{all ? text("Minder tonen", "Show less") : text(`Alle ${users.length} tonen`, `Show all ${users.length}`)}</Button>}
  </CardContent></Card>;
}
