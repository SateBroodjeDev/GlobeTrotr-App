import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock, Users } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { canBill, hasFeature } from "@/lib/plans";
import type { TripMemberRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team & reisrechten — GlobeTrotr" },
      {
        name: "description",
        content: "Beheer reisrechten per klantreis en houd toegang beperkt tot de juiste reis.",
      },
    ],
  }),
  component: TeamPage,
});

const AGENCY_ROLES: { id: TripMemberRole; label: string; permissions: string[] }[] = [
  {
    id: "owner",
    label: "Workspace-eigenaar",
    permissions: ["Reizen beheren", "Uitgaven beheren", "Leden beheren", "Abonnement beheren"],
  },
  {
    id: "advisor",
    label: "Reisadviseur",
    permissions: ["Reizen beheren", "Uitgaven beheren"],
  },
  { id: "finance", label: "Financiën", permissions: ["Uitgaven beheren"] },
  { id: "client", label: "Klant / reiziger", permissions: ["Reis bekijken"] },
  { id: "viewer", label: "Kijker", permissions: ["Reis bekijken"] },
];

const ALL_PERMISSIONS = [
  "Reizen beheren",
  "Uitgaven beheren",
  "Leden beheren",
  "Abonnement beheren",
  "Reis bekijken",
];

function TeamPage() {
  const { state } = useWorkspace();
  const allowed = hasFeature(state.plan, "roles") && canBill(state.role);
  const trips = state.trips ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Team & reisrechten</h1>
        <p className="text-sm text-muted-foreground">
          Beheer toegang per reis. Een reisgenoot krijgt nooit automatisch toegang tot al je reizen.
        </p>
      </div>

      {!allowed && (
        <p className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          <Lock className="size-4" /> Uitgebreid rollenbeheer zit in Agency (eigenaarsrol).{" "}
          <Link to="/billing" className="underline">
            Upgrade
          </Link>
        </p>
      )}

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Reisteams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reisgenoten voeg je toe in <strong>Reisinstellingen → Reisgenoten</strong>. E-mailuitnodigingen
            volgen zodra Lovable Cloud Emails is geactiveerd; deze pagina doet dus niet alsof er al een
            uitnodiging is verstuurd.
          </p>
          {trips.length ? (
            <ul className="space-y-3">
              {trips.map((trip) => {
                const members = trip.members ?? [];
                const memberCount = 1 + members.length;
                return (
                  <li key={trip.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{trip.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {memberCount} {memberCount === 1 ? "lid" : "leden"}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm" disabled={!allowed}>
                        <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
                          <Users className="size-4" /> Reisinstellingen
                        </Link>
                      </Button>
                    </div>
                    {members.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {members.map((member) => (
                          <Badge key={member.id} variant="secondary">
                            {member.name} ·{" "}
                            {AGENCY_ROLES.find((role) => role.id === member.role)?.label ?? member.role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Maak eerst een reis aan om een reisteam samen te stellen.
            </p>
          )}
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
                {AGENCY_ROLES.map((role) => (
                  <th key={role.id} className="p-3">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((permission) => (
                <tr key={permission} className="border-t border-border">
                  <td className="p-3">{permission}</td>
                  {AGENCY_ROLES.map((role) => (
                    <td key={role.id} className="p-3 text-center">
                      {role.permissions.includes(permission) ? (
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
