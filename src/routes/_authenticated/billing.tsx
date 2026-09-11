import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { PLANS, canBill, planOf } from "@/lib/plans";
import { CURRENCIES } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Abonnement & facturatie — GlobeTrotr" },
      {
        name: "description",
        content: "Vergelijk Free, Pro en Agency en beheer je GlobeTrotr-abonnement.",
      },
      { property: "og:title", content: "Abonnement & facturatie — GlobeTrotr" },
      {
        property: "og:description",
        content: "Vergelijk plannen en beheer de beschikbare functies van je GlobeTrotr-account.",
      },
    ],
  }),
  component: Billing,
});

function Billing() {
  const { state, update, changePlan } = useWorkspace();
  const { text } = useLocale();
  const current = planOf(state.plan);
  const mayBill = canBill(state.role);
  const [changingPlan, setChangingPlan] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{text("Abonnement & facturatie", "Plan & billing")}</h1>
        <p className="text-sm text-muted-foreground">
          {text("Huidig plan", "Current plan")}: <strong>{current.name}</strong> · {seatLabel(current.id, current.seats, text)} ·{" "}
          {current.price === 0 ? text("gratis", "free") : `€${current.price}/${text("maand", "month")}`}
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
                  {active && <Badge>{text("Actief", "Active")}</Badge>}
                </div>
                <p className="font-display text-3xl font-semibold">
                  €{p.price}
                  <span className="text-sm font-normal text-muted-foreground">/{text("mnd", "mo")}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-success" /> {highlightLabel(h, text)}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={active ? "outline" : "default"}
                  disabled={active || !mayBill || changingPlan}
                  onClick={async () => {
                    setChangingPlan(true);
                    try {
                      const saved = await changePlan(p.id);
                      if (saved) {
                        toast.success(text(`Je abonnement is gewijzigd naar ${p.name}.`, `Your plan has been changed to ${p.name}.`));
                      } else {
                        toast.error(text("Je abonnement kon niet worden opgeslagen. Probeer opnieuw.", "Your plan could not be saved. Please try again."));
                      }
                    } finally {
                      setChangingPlan(false);
                    }
                  }}
                >
                  {active
                    ? text("Huidig plan", "Current plan")
                    : changingPlan
                      ? text("Wijzigen…", "Changing…")
                      : mayBill
                        ? text(`Kies ${p.name}`, `Choose ${p.name}`)
                        : text("Alleen eigenaar", "Owner only")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!mayBill && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> {text("Alleen de workspace-eigenaar kan het abonnement wijzigen.", "Only the workspace owner can change the plan.")}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{text("Betalingen & facturen", "Payments & invoices")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{text("Er zijn nog geen echte GlobeTrotr-facturen of betalingen gekoppeld.", "No real GlobeTrotr invoices or payments are connected yet.")}</p>
            <p>
              {text("Tot Paddle Checkout en ondertekende webhookverificatie zijn gebouwd, wijzigt deze pagina alleen de beschikbare functies in je testomgeving en wordt er niets afgeschreven.", "Until Paddle Checkout and signed webhook verification are available, this page only changes features in your test environment and no money is charged.")}
            </p>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{text("Reisinstellingen", "Trip settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <label className="block">
              <span className="text-muted-foreground">{text("Rapportagevaluta", "Reporting currency")}</span>
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
              {text("Alle uitgaven worden live omgerekend naar deze valuta met dagkoersen van de ECB.", "All expenses are converted to this currency using daily ECB rates.")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function seatLabel(id: string, fallback: string, text: (nl: string, en: string) => string) {
  return text(fallback, id === "free" ? "For you" : id === "pro" ? "For you and your travel group" : "Unlimited");
}

function highlightLabel(value: string, text: (nl: string, en: string) => string) {
  const translations: Record<string, string> = {
    "2 actieve reizen": "2 active trips", "Routekaart & uitgaven": "Route map & expenses", "CSV-export": "CSV export",
    "Onbeperkt reizen": "Unlimited trips", "Live weer & valutakoersen": "Live weather & exchange rates", "PDF-reisoverzicht": "PDF trip overview",
    "Eigen merk en domein": "Your own brand and domain", "Rollen en rechten": "Roles and permissions", "Declarabele klantuitgaven": "Billable client expenses", "Bonnetjes bij uitgaven": "Expense receipts",
  };
  return text(value, translations[value] ?? value);
}
