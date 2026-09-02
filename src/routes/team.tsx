import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace, uid } from "@/lib/workspace";
import { ROLES, canBill, hasFeature } from "@/lib/plans";
import type { RoleId } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team, rollen & rechten — AtlasLedger" },
      {
        name: "description",
        content:
          "Nodig medereizigers, boekhouders en kijkers uit met een fijnmazige rollen- en rechtenmatrix.",
      },
      { property: "og:title", content: "Team, rollen & rechten — AtlasLedger" },
      {
        property: "og:description",
        content: "Multi-user samenwerking met owner, editor, accountant en viewer.",
      },
    ],
  }),
  component: TeamPage,
});

const ALL_PERMS = [
  "Reizen beheren",
  "Uitgaven boeken",
  "Uitgaven bekijken",
  "Exporteren",
  "Leden uitnodigen",
  "Abonnement wijzigen",
  "Reizen bekijken",
];

function TeamPage() {
  const { state, update } = useWorkspace();
  const allowed = hasFeature(state.plan, "roles") && canBill(state.role);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("editor");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Team & rechtenmatrix</h1>
        <p className="text-sm text-muted-foreground">
          Werk samen met medereizigers, je boekhouder en publieke kijkers.
        </p>
      </div>

      {!allowed && (
        <p className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          <Lock className="size-4" /> Uitgebreid rollenbeheer zit in Business/Agency (eigenaarsrol).{" "}
          <Link to="/billing" className="underline">
            Upgrade
          </Link>
        </p>
      )}

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              placeholder="Naam"
              value={name}
              disabled={!allowed}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="E-mail"
              value={email}
              disabled={!allowed}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              aria-label="Rol"
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
              value={role}
              disabled={!allowed}
              onChange={(e) => setRole(e.target.value as RoleId)}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button
              disabled={!allowed}
              onClick={() => {
                if (!name.trim() || !email.trim()) {
                  toast.error("Naam en e-mail invullen");
                  return;
                }
                update((s) => ({
                  ...s,
                  members: [...s.members, { id: uid(), name, email, role }],
                }));
                setName("");
                setEmail("");
                toast.success("Uitnodiging verstuurd");
              }}
            >
              <Plus className="size-4" /> Uitnodigen
            </Button>
          </div>

          <ul className="divide-y rounded-xl border border-border">
            {state.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  <strong>{m.name}</strong>{" "}
                  <span className="text-muted-foreground">{m.email}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {ROLES.find((r) => r.id === m.role)?.label}
                  </Badge>
                  {allowed && (
                    <button
                      aria-label="Lid verwijderen"
                      onClick={() =>
                        update((s) => ({ ...s, members: s.members.filter((x) => x.id !== m.id) }))
                      }
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rechtenmatrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Recht</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="p-3">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMS.map((perm) => (
                <tr key={perm} className="border-t border-border">
                  <td className="p-3">{perm}</td>
                  {ROLES.map((r) => (
                    <td key={r.id} className="p-3 text-center">
                      {r.can.includes(perm) ? (
                        <Check className="mx-auto size-4 text-success" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
