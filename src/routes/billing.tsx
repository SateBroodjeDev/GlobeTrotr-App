import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { PLANS, canBill, planOf } from "@/lib/plans";
import { CURRENCIES, formatMoney } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Abonnement & facturatie — AtlasLedger" },
      {
        name: "description",
        content: "Vergelijk Free, Pro en Business/Agency en beheer je AtlasLedger-abonnement.",
      },
      { property: "og:title", content: "Abonnement & facturatie — AtlasLedger" },
      {
        property: "og:description",
        content: "Feature-gating, prijzen en facturen in één billing portal.",
      },
    ],
  }),
  component: Billing,
});

function Billing() {
  const { state, update } = useWorkspace();
  const current = planOf(state.plan);
  const mayBill = canBill(state.role);

  const invoices = [
    { id: "INV-2026-014", date: "2026-08-01", amount: current.price },
    { id: "INV-2026-013", date: "2026-07-01", amount: current.price },
    { id: "INV-2026-012", date: "2026-06-01", amount: current.price },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Abonnement & facturatie</h1>
        <p className="text-sm text-muted-foreground">
          Huidig plan: <strong>{current.name}</strong> · {current.seats} ·{" "}
          {current.price === 0 ? "gratis" : `€${current.price}/maand`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const active = p.id === state.plan;
          return (
            <Card key={p.id} className={`surface ${active ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {active && <Badge>Actief</Badge>}
                </div>
                <p className="font-display text-3xl font-semibold">
                  €{p.price}
                  <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-success" /> {h}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={active ? "outline" : "default"}
                  disabled={active || !mayBill}
                  onClick={() => {
                    update((s) => ({ ...s, plan: p.id }));
                    toast.success(`Overgestapt naar ${p.name}`);
                  }}
                >
                  {active ? "Huidig plan" : mayBill ? `Kies ${p.name}` : "Alleen eigenaar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!mayBill && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> Alleen de workspace-eigenaar kan het abonnement wijzigen.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Facturen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3">{i.id}</td>
                    <td className="p-3 text-muted-foreground">{i.date}</td>
                    <td className="p-3 text-right">{formatMoney(i.amount, "EUR")}</td>
                    <td className="p-3 text-right">
                      <button className="text-primary underline" onClick={() => window.print()}>
                        Bekijk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workspace-instellingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Rapportagevaluta</span>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2"
                value={state.baseCurrency}
                onChange={(e) => update((s) => ({ ...s, baseCurrency: e.target.value }))}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-muted-foreground">
              Alle uitgaven worden live omgerekend naar deze valuta met dagkoersen van de ECB.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
