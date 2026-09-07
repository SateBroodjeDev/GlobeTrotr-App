import { useState } from "react";
import { Check, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { PlanId, TripMember, TripMemberRole } from "@/lib/types";
import { uid } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale";

const PERSONAL_ROLES: { id: TripMemberRole; label: string; description: string }[] = [
  { id: "traveler", label: "Medereiziger", description: "Plant mee en voegt kosten toe." },
  { id: "viewer", label: "Kijker", description: "Ziet de reis, maar wijzigt niets." },
];

const AGENCY_ROLES: { id: TripMemberRole; label: string; description: string }[] = [
  { id: "advisor", label: "Reisadviseur", description: "Beheert planning en boekingen." },
  { id: "finance", label: "Financiën", description: "Beheert kosten en facturen." },
  { id: "client", label: "Klant / reiziger", description: "Ziet alleen deze reis en documenten." },
];

const labels: Record<TripMemberRole, string> = {
  owner: "Eigenaar",
  traveler: "Medereiziger",
  viewer: "Kijker",
  advisor: "Reisadviseur",
  finance: "Financiën",
  client: "Klant / reiziger",
};

export function TripMembers({
  members,
  plan,
  editable,
  onChange,
  ownerName = "Jij",
  ownerEmail = "Eigenaar van deze reis",
}: {
  members: TripMember[];
  plan: PlanId;
  editable: boolean;
  onChange: (members: TripMember[]) => void;
  ownerName?: string;
  ownerEmail?: string;
}) {
  const { text } = useLocale();
  const roles = plan === "agency" ? AGENCY_ROLES : PERSONAL_ROLES;
  const maxMembers = plan === "free" ? 2 : Infinity;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TripMemberRole>(roles[0]!.id);

  function addMember() {
    if (!name.trim() || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(text("Vul een naam en geldig e-mailadres in.", "Enter a name and valid email address."));
      return;
    }
    if (members.some((member) => member.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.error(text("Dit e-mailadres is al toegevoegd aan deze reis.", "This email address has already been added to this trip."));
      return;
    }
    if (members.length >= maxMembers) {
      toast.error(text("Free bevat maximaal twee reisgenoten. Upgrade naar Pro voor onbeperkt.", "Free supports up to two travellers. Upgrade to Pro for unlimited travellers."));
      return;
    }
    onChange([
      ...members,
      {
        id: uid(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: "invited",
        invitedAt: new Date().toISOString(),
      },
    ]);
    setName("");
    setEmail("");
    toast.success(text("Reisgenoot toegevoegd als uitgenodigd.", "Traveller added as invited."));
  }

  function updateMember(id: string, patch: Partial<Pick<TripMember, "role" | "status">>) {
    onChange(members.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  }

  return (
    <Card className="surface">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="size-4" /> {text("Reisgenoten", "Travellers")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {text("Voeg reisgenoten toe met een rol voor alleen deze reis. E-mailverzending en accepteren worden geactiveerd zodra Lovable Cloud Emails is ingesteld. Deze lijst wordt ook gebruikt voor de kostenverdeling en de betaler bij boekingen.", "Add travellers with a role for this trip. Email delivery and acceptance will be enabled once Lovable Cloud Emails is configured. This list is also used for expense splitting and booking payers.")}
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          <Input
            value={name}
            disabled={!editable}
            placeholder={text("Naam", "Name")}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            type="email"
            value={email}
            disabled={!editable}
            placeholder="E-mail"
            onChange={(event) => setEmail(event.target.value)}
          />
          <select
            aria-label={text("Rol reisgenoot", "Traveller role")}
            className="rounded-lg border border-input bg-card px-3 text-sm"
            value={role}
            disabled={!editable}
            onChange={(event) => setRole(event.target.value as TripMemberRole)}
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {roleLabel(item.id, item.label, text)}
              </option>
            ))}
          </select>
          <Button disabled={!editable} onClick={addMember}>
            <Plus className="size-4" /> {text("Toevoegen", "Add")}
          </Button>
        </div>
        <div className="space-y-2">
          <MemberRow name={ownerName} email={ownerEmail} role="owner" status="active" owner />
          {members.map((member) => (
            <MemberRow
              key={member.id}
              {...member}
              roles={roles}
              editable={editable}
              onChangeRole={(nextRole) => updateMember(member.id, { role: nextRole })}
              onChangeStatus={(status) => updateMember(member.id, { status })}
              onRemove={
                editable
                  ? () => onChange(members.filter((item) => item.id !== member.id))
                  : undefined
              }
            />
          ))}
        </div>
        {plan === "free" && (
          <p className="text-xs text-muted-foreground">
            {text("Free: maximaal twee reisgenoten per reis. Pro biedt onbeperkte reisgenoten.", "Free: up to two travellers per trip. Pro offers unlimited travellers.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MemberRow({
  name,
  email,
  role,
  status,
  owner,
  roles,
  editable,
  onChangeRole,
  onChangeStatus,
  onRemove,
}: Pick<TripMember, "name" | "email" | "role" | "status"> & {
  owner?: boolean;
  roles?: { id: TripMemberRole; label: string }[];
  editable?: boolean;
  onChangeRole?: (role: TripMemberRole) => void;
  onChangeStatus?: (status: TripMember["status"]) => void;
  onRemove?: () => void;
}) {
  const { text } = useLocale();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block font-medium">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{email}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {editable && roles && onChangeRole ? (
          <select
            aria-label={`${text("Rol van", "Role of")} ${name}`}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
            value={role}
            onChange={(event) => onChangeRole(event.target.value as TripMemberRole)}
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {roleLabel(item.id, item.label, text)}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant="secondary">{roleLabel(role, labels[role], text)}</Badge>
        )}
        {!owner && (
          <Badge variant={status === "active" ? "default" : "outline"}>
            {status === "active" ? text("Actief", "Active") : text("Uitgenodigd", "Invited")}
          </Badge>
        )}
        {!owner && editable && onChangeStatus && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              status === "active" ? text(`${name} weer als uitgenodigd markeren`, `Mark ${name} as invited again`) : text(`${name} activeren`, `Activate ${name}`)
            }
            title={
              status === "active" ? text("Zet terug op uitgenodigd", "Set back to invited") : text("Handmatig als actief markeren", "Mark as active manually")
            }
            onClick={() => onChangeStatus(status === "active" ? "invited" : "active")}
          >
            {status === "active" ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={text(`${name} verwijderen`, `Remove ${name}`)}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </span>
    </div>
  );
}

function roleLabel(role: TripMemberRole, fallback: string, text: (nl: string, en: string) => string) {
  const english: Record<TripMemberRole, string> = { owner: "Owner", traveler: "Traveller", viewer: "Viewer", advisor: "Travel advisor", finance: "Finance", client: "Client / traveller" };
  return text(fallback, english[role]);
}
