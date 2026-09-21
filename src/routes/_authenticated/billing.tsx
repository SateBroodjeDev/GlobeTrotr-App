import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  changePaddlePlan,
  createPaddleCheckoutBinding,
  createPaddleInvoiceLink,
  createPaddlePortalSession,
  getBillingOverview,
} from "@/lib/billing.functions";
import { useLocale } from "@/lib/locale";
import { loadPaddle } from "@/lib/paddle-client";
import { PLANS, canBill, planOf } from "@/lib/plans";
import { CURRENCIES } from "@/lib/services";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Abonnement & facturatie — GlobeTrotr" }] }),
  component: Billing,
});

function Billing() {
  const { state, update, refreshWorkspace } = useWorkspace();
  const { text, locale } = useLocale();
  const billing = useQuery({
    queryKey: ["billing-overview"],
    queryFn: () => getBillingOverview(),
    retry: false,
  });
  const current = planOf(billing.data?.plan ?? state.plan);
  const mayBill = canBill(state.role);
  const [busy, setBusy] = useState<string | null>(null);
  const [billingMode, setBillingMode] = useState<"recurring" | "oneTime">("recurring");

  async function checkout(plan: "pro" | "agency") {
    if (!billing.data) return;
    if (billingMode === "oneTime") {
      const currentEnd = billing.data.oneTimeAccess?.endsAt
        ? new Date(billing.data.oneTimeAccess.endsAt).toLocaleDateString(locale)
        : null;
      const confirmed = window.confirm(
        currentEnd
          ? text(
              `Je toegang loopt nu tot ${currentEnd}. Na een geslaagde betaling wordt precies één maand toegevoegd. Wil je doorgaan?`,
              `Your access currently runs until ${currentEnd}. Exactly one month is added after successful payment. Continue?`,
            )
          : text(
              "Je koopt precies één maand toegang zonder automatische verlenging. Wil je doorgaan?",
              "You are buying exactly one month of access without automatic renewal. Continue?",
            ),
      );
      if (!confirmed) return;
    }
    const priceId = billing.data.checkout.prices[billingMode][plan];
    if (!billing.data.checkout.clientToken || !priceId) {
      toast.error(
        text("Paddle is nog niet volledig geconfigureerd.", "Paddle is not fully configured yet."),
      );
      return;
    }
    setBusy(plan);
    try {
      const binding = await createPaddleCheckoutBinding({
        data: { plan, mode: billingMode === "oneTime" ? "one_time" : "recurring" },
      });
      const paddle = await loadPaddle(
        billing.data.checkout.clientToken,
        billing.data.checkout.environment,
      );
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: billing.data.checkout.email ? { email: billing.data.checkout.email } : undefined,
        customData: {
          checkout_binding: binding.token,
        },
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: locale.startsWith("nl") ? "nl" : "en",
          successUrl: `${window.location.origin}/billing?checkout=success`,
        },
      });
    } catch {
      toast.error(text("De checkout kon niet worden geopend.", "Checkout could not be opened."));
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    try {
      window.location.assign((await createPaddlePortalSession()).url);
    } catch {
      toast.error(
        text(
          "Het abonnementsbeheer kon niet worden geopend.",
          "Subscription management could not be opened.",
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  async function selectPaidPlan(plan: "pro" | "agency") {
    if (billingMode === "oneTime" || !billing.data?.subscription) {
      await checkout(plan);
      return;
    }
    if (
      !window.confirm(
        text(
          `Wil je je abonnement nu wijzigen naar ${planOf(plan).name}? Paddle verwerkt de evenredige verrekening meteen.`,
          `Change your subscription to ${planOf(plan).name} now? Paddle will process the prorated difference immediately.`,
        ),
      )
    )
      return;
    setBusy(plan);
    try {
      const result = await changePaddlePlan({ data: { plan } });
      toast.success(
        result.changed
          ? text(
              "De bevestiging volgt na verwerking door Paddle.",
              "Confirmation follows after Paddle processes the change.",
            )
          : text(
              "Dit abonnement staat bij Paddle al op het gekozen plan; er is niets gefactureerd.",
              "This subscription already uses the selected plan in Paddle; nothing was billed.",
            ),
      );
      await billing.refetch();
    } catch {
      toast.error(
        text("Het abonnement kon niet worden gewijzigd.", "The subscription could not be changed."),
      );
    } finally {
      setBusy(null);
    }
  }

  async function invoice(transactionId: string) {
    setBusy(transactionId);
    try {
      window.open(
        (await createPaddleInvoiceLink({ data: { transactionId } })).url,
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      toast.error(text("De factuur kon niet worden opgehaald.", "Invoice could not be retrieved."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">
          {text("Abonnement & facturatie", "Plan & billing")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {text("Huidig plan", "Current plan")}: <strong>{current.name}</strong> ·{" "}
          {current.price ? `€${current.price}/${text("maand", "month")}` : text("gratis", "free")}
        </p>
      </header>
      <Card className="surface">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {text("Hoe wil je betalen?", "How would you like to pay?")}
            </p>
            <p className="text-sm text-muted-foreground">
              {billingMode === "recurring"
                ? text(
                    "Automatische maandelijkse verlenging via de beschikbare kaart- of PayPal-opties.",
                    "Automatic monthly renewal using the available card or PayPal options.",
                  )
                : text(
                    "Eén maand toegang zonder automatische verlenging; iDEAL wordt getoond wanneer Paddle dit beschikbaar stelt.",
                    "One month of access without automatic renewal; iDEAL is shown when Paddle makes it available.",
                  )}
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-lg border p-1">
            <Button
              type="button"
              size="sm"
              variant={billingMode === "recurring" ? "default" : "ghost"}
              onClick={() => setBillingMode("recurring")}
            >
              {text("Maandelijks", "Monthly")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={billingMode === "oneTime" ? "default" : "ghost"}
              onClick={() => setBillingMode("oneTime")}
            >
              {text("Eén maand", "One month")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const active = plan.id === current.id;
          return (
            <Card key={plan.id} className={`surface ${active ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {active && <Badge>{text("Actief", "Active")}</Badge>}
                </div>
                <p className="font-display text-3xl font-semibold">
                  €{plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{text("mnd", "mo")}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-success" />
                      {highlightLabel(item, text)}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Button className="w-full" variant="outline" disabled>
                    {active
                      ? text("Huidig plan", "Current plan")
                      : text("Via abonnement beheren", "Use subscription management")}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={active ? "outline" : "default"}
                    disabled={!mayBill || busy !== null || (active && billingMode === "recurring")}
                    onClick={() => plan.id !== "free" && selectPaidPlan(plan.id)}
                  >
                    {busy === plan.id
                      ? text("Laden…", "Loading…")
                      : billingMode === "oneTime" && active
                        ? text("Voeg één maand toe", "Add one month")
                        : active
                        ? text("Huidig plan", "Current plan")
                        : mayBill
                          ? text(`Kies ${plan.name}`, `Choose ${plan.name}`)
                          : text("Alleen eigenaar", "Owner only")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!mayBill && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {text(
            "Alleen de workspace-eigenaar kan het abonnement wijzigen.",
            "Only the workspace owner can change the subscription.",
          )}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-sm">
              {text("Betaling en verlenging", "Payment and renewal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {billing.data?.subscription ? (
              <>
                <p>
                  <strong>{billing.data.subscription.status}</strong> ·{" "}
                  {billing.data.subscription.currency}{" "}
                  {(billing.data.subscription.recurring_total_minor / 100).toFixed(2)} /{" "}
                  {billing.data.subscription.billing_interval}
                </p>
                <p className="text-muted-foreground">
                  {billing.data.subscription.current_period_end
                    ? `${text("Volgende periode/einddatum", "Next period/end date")}: ${new Date(billing.data.subscription.current_period_end).toLocaleDateString(locale)}`
                    : text(
                        "De betaalperiode wordt door Paddle bijgewerkt.",
                        "The billing period is updated by Paddle.",
                      )}
                </p>
                <Button variant="outline" disabled={!mayBill || busy !== null} onClick={portal}>
                  <ExternalLink className="size-4" />
                  {text("Abonnement en facturen beheren", "Manage subscription and invoices")}
                </Button>
              </>
            ) : billing.data?.oneTimeAccess ? (
              <div className="space-y-1">
                <p className="font-medium">
                  {text("Vooruitbetaalde toegang", "Prepaid access")}: {planOf(billing.data.oneTimeAccess.plan).name}
                </p>
                <p className="text-muted-foreground">
                  {text("Toegang tot", "Access until")}: {new Date(billing.data.oneTimeAccess.endsAt).toLocaleDateString(locale)}
                </p>
                <p className="text-muted-foreground">
                  {billing.data.oneTimeAccess.monthsPurchased} {text("nog geldige maandbetalingen", "active monthly purchases")}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {text(
                  "Je hebt nog geen betaald Paddle-abonnement. De definitieve prijs en belasting worden vóór betaling in de beveiligde checkout getoond.",
                  "You do not have a paid Paddle subscription yet. The final price and tax are shown in secure checkout before payment.",
                )}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await Promise.all([billing.refetch(), refreshWorkspace()]);
                toast.success(
                  text("Abonnementsstatus bijgewerkt.", "Subscription status refreshed."),
                );
              }}
            >
              {text("Status vernieuwen", "Refresh status")}
            </Button>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-sm">
              {text("Rapportagevaluta", "Reporting currency")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-lg border border-input bg-card px-3 py-2"
              value={state.baseCurrency}
              onChange={(event) =>
                update((value) => ({ ...value, baseCurrency: event.target.value }))
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>
      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-sm">
            {text("Betalingen en facturen", "Payments and invoices")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billing.data?.transactions?.length ? (
            <div className="divide-y">
              {billing.data.transactions.map((transaction: any) => (
                <div
                  key={transaction.provider_transaction_id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.currency} {(transaction.total_minor / 100).toFixed(2)}{" "}
                      <Badge variant="outline" className="ml-2">
                        {transaction.status}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.occurred_at).toLocaleString(locale)}
                    </p>
                  </div>
                  {transaction.total_minor <= 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {text("Geen Paddle-PDF bij een betaling van €0", "Paddle does not provide a PDF for a €0 transaction")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        busy !== null ||
                        !["paid", "completed", "refunded", "partially_refunded"].includes(
                          transaction.status,
                        )
                      }
                      onClick={() => invoice(transaction.provider_transaction_id)}
                    >
                      <Download className="size-4" />
                      {text("Factuur downloaden", "Download invoice")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {text(
                "Er zijn nog geen betalingen geregistreerd.",
                "No payments have been recorded yet.",
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function highlightLabel(value: string, text: (nl: string, en: string) => string) {
  const translations: Record<string, string> = {
    "2 actieve reizen": "2 active trips",
    "Routekaart & uitgaven": "Route map & expenses",
    "CSV-export": "CSV export",
    "Onbeperkt reizen": "Unlimited trips",
    "Live weer & valutakoersen": "Live weather & exchange rates",
    "PDF-reisoverzicht": "PDF trip overview",
    "Eigen merk en domein": "Your own brand and domain",
    "Rollen en rechten": "Roles and permissions",
    "Declarabele klantuitgaven": "Billable client expenses",
    "Bonnetjes bij uitgaven": "Expense receipts",
  };
  return text(value, translations[value] ?? value);
}
