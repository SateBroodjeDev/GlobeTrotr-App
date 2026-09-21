import { getCorporateStaffActivity } from "@/lib/corporate-business.functions";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCorporateStaff,
  inviteCorporateStaff,
  saveCorporateStaff,
  suggestCorporateMailbox,
} from "@/lib/corporate-business.functions";
import { useLocale } from "@/lib/locale";
export const Route = createFileRoute("/_authenticated/corporate-admin/staff")({ component: Page });
const keys = ["users", "agencies", "finance", "mail", "operations", "issues"];
function Page() {
  const { text } = useLocale(),
    q = useQuery({ queryKey: ["corporate-staff"], queryFn: () => getCorporateStaff() }),
    [selected, setSelected] = useState(""),
    [reason, setReason] = useState(""),
    [form, setForm] = useState<any>(),
    [invite, setInvite] = useState({ name: "", email: "" }),
    [inviting, setInviting] = useState(false);
  useEffect(() => {
    const s = q.data?.staff.find((x: any) => x.user_id === selected);
    if (s)
      setForm({
        userId: s.user_id,
        role: s.role,
        jobTitle: s.job_title ?? "",
        active: s.active,
        permissions: s.permissions ?? {},
        mailboxAddress: s.mailbox?.address ?? "",
      });
  }, [selected, q.data]);
  async function choose(userId: string) {
    setSelected(userId);
    const existing = q.data?.staff.find((x: any) => x.user_id === userId);
    if (existing) return;
    const person = q.data?.candidates.find((x: any) => x.id === userId),
      suggestion = await suggestCorporateMailbox({ data: { name: person?.name ?? "" } });
    setForm({
      userId,
      role: "support",
      jobTitle: "",
      active: true,
      permissions: { mail: true, issues: true },
      mailboxAddress: suggestion.address,
    });
  }
  async function save() {
    const risky = !form.active || form.role === "owner";
    if (
      risky &&
      !window.confirm(
        text(
          "Dit wijzigt kritieke bedrijfsrechten. Weet je zeker dat je wilt doorgaan?",
          "This changes critical company permissions. Are you sure you want to continue?",
        ),
      )
    )
      return;
    try {
      await saveCorporateStaff({ data: { ...form, reason } });
      await q.refetch();
      setReason("");
      toast.success(
        text(
          "Medewerker bijgewerkt. Laat deze persoon opnieuw inloggen.",
          "Staff member updated. Ask this person to sign in again.",
        ),
      );
    } catch (e: any) {
      toast.error(
        e?.message === "LAST_OWNER"
          ? text(
              "De laatste eigenaar kan niet worden verwijderd.",
              "The last owner cannot be removed.",
            )
          : e?.message === "STAFF_MAILBOX_IN_USE"
            ? text("Dit mailadres is al aan een ander postvak gekoppeld.", "This address belongs to another mailbox.")
            : e?.message === "INVALID_STAFF"
              ? text("Controleer het mailadres, de functie en de reden.", "Check the email address, job title and reason.")
              : text(`Medewerker kon niet worden bijgewerkt (${e?.message || "ONBEKEND"}).`, `Staff member could not be updated (${e?.message || "UNKNOWN"}).`),
      );
    }
  }
  async function invitePerson() {
    setInviting(true);
    try {
      const result = await inviteCorporateStaff({ data: invite });
      await q.refetch();
      setInvite({ name: "", email: "" });
      await choose(result.userId);
      toast.success(
        text(
          "Uitnodiging verstuurd. Stel nu de rol en mailbox in.",
          "Invitation sent. Now configure the role and mailbox.",
        ),
      );
    } catch {
      toast.error(
        text("Medewerker kon niet worden uitgenodigd.", "Staff member could not be invited."),
      );
    } finally {
      setInviting(false);
    }
  }
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{text("Nieuwe medewerker uitnodigen", "Invite new staff member")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder={text("Volledige naam", "Full name")}
            value={invite.name}
            onChange={(e) => setInvite({ ...invite, name: e.target.value })}
          />
          <Input
            type="email"
            placeholder="naam@example.com"
            value={invite.email}
            onChange={(e) => setInvite({ ...invite, email: e.target.value })}
          />
          <Button
            disabled={inviting || invite.name.trim().length < 2 || !invite.email.includes("@")}
            onClick={() => void invitePerson()}
          >
            {text("Uitnodigen", "Invite")}
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <UserCog className="size-5" />
              {text("Medewerkers", "Staff")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={selected}
              onChange={(e) => void choose(e.target.value)}
            >
              <option value="">{text("Selecteer account", "Select account")}</option>
              {q.data?.candidates.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.email}
                </option>
              ))}
            </select>
            {q.data?.staff.map((s: any) => (
              <button
                key={s.user_id}
                onClick={() => void choose(s.user_id)}
                className="w-full rounded-xl border p-3 text-left"
              >
                <strong className="block truncate">{s.name || s.accountEmail}</strong>
                <span className="flex gap-2 text-xs">
                  <Badge variant="outline">{s.role}</Badge>
                  {!s.active && <Badge variant="destructive">{text("Inactief", "Inactive")}</Badge>}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
        {form ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {q.data?.candidates.find((p: any) => p.id === form.userId)?.name ||
                  text("Medewerker", "Staff member")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <Label>{text("Rol", "Role")}</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <Label>{text("Functie", "Job title")}</Label>
                  <Input
                    maxLength={100}
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <Label>{text("Persoonlijke mailbox", "Personal mailbox")}</Label>
                  <Input
                    value={form.mailboxAddress}
                    onChange={(e) =>
                      setForm({ ...form, mailboxAddress: e.target.value.toLowerCase() })
                    }
                    placeholder="v.achternaam@globetrotr.nl"
                  />
                </label>
              </div>
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <legend className="mb-2 font-medium">
                  {text("Bedrijfsrechten", "Company permissions")}
                </legend>
                {keys.map((k) => (
                  <label key={k} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.role === "owner" || Boolean(form.permissions[k])}
                      disabled={form.role === "owner"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissions: { ...form.permissions, [k]: e.target.checked },
                        })
                      }
                    />
                    {k}
                  </label>
                ))}
              </fieldset>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                {text("Actieve medewerker", "Active staff member")}
              </label>
              <label className="block space-y-2">
                <Label>{text("Reden (verplicht)", "Reason (required)")}</Label>
                <Input
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={text("Minimaal 10 tekens", "At least 10 characters")}
                />
              </label>
              <Button disabled={reason.trim().length < 10} onClick={() => void save()}>
                <Save className="size-4" />
                {text("Medewerker opslaan", "Save staff member")}
              </Button>
              <StaffActivity userId={selected} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              {text(
                "Selecteer een bestaand account om bedrijfsrechten toe te wijzen.",
                "Select an existing account to assign company permissions.",
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function StaffActivity({ userId }: { userId: string }) {
  const { text } = useLocale();
  const { data = [] } = useQuery({
    queryKey: ["corporate-staff-activity", userId],
    queryFn: () => getCorporateStaffActivity({ data: { userId } }),
    enabled: Boolean(userId),
  });
  return (
    <section className="space-y-2 border-t pt-4">
      <h3 className="font-medium">{text("Rechtenhistorie", "Permission history")}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {text("Nog geen wijzigingen vastgelegd.", "No changes recorded yet.")}
        </p>
      ) : (
        data.slice(0, 10).map((entry: any) => (
          <div
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
          >
            <span>
              <strong>{entry.action}</strong> · {entry.result}
            </span>
            <time className="text-muted-foreground">
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(entry.created_at))}
            </time>
          </div>
        ))
      )}
    </section>
  );
}
