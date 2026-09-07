import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWorkspace } from "@/lib/workspace";
import { hasFeature } from "@/lib/plans";
import { CATEGORIES } from "@/lib/types";
import { convert, formatMoney } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Agency-overzicht — GlobeTrotr" },
      {
        name: "description",
        content: "Inzicht in reizen, kosten en declarabele uitgaven voor je agency.",
      },
      { property: "og:title", content: "Agency-overzicht — GlobeTrotr" },
      {
        property: "og:description",
        content: "Overzicht van reizen, kosten en declarabele uitgaven.",
      },
    ],
  }),
  component: Analytics,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

function Analytics() {
  const { text } = useLocale();
  const { state, rates } = useWorkspace();
  const allowed = hasFeature(state.plan, "analytics");
  const base = state.baseCurrency;
  const trips = state.trips ?? [];

  const perCategory = CATEGORIES.map((c) => ({
    name: categoryLabel(c.id, c.label, text),
    value: trips
      .flatMap((t) => t.expenses)
      .filter((e) => e.category === c.id)
      .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
  })).filter((d) => d.value > 0);

  const perTrip = trips.map((t) => ({
    name: t.name.length > 18 ? `${t.name.slice(0, 18)}…` : t.name,
    expenses: Math.round(
      t.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
    ),
    budget: t.budget,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const activeTrips = trips.filter((trip) => !trip.archived && trip.end >= today).length;
  const travellers = trips.reduce(
    (total, trip) => total + 1 + (trip.members ?? []).filter((member) => member.status === "active").length,
    0,
  );
  const totalSpent = trips
    .flatMap((trip) => trip.expenses)
    .reduce((sum, expense) => sum + convert(expense.amount, expense.currency, base, rates), 0);
  const totalBillable = trips
    .flatMap((trip) => trip.expenses)
    .filter((expense) => expense.billable)
    .reduce((sum, expense) => sum + convert(expense.amount, expense.currency, base, rates), 0);

  if (!allowed) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
        <Lock className="size-4" /> {text("Het analytics-dashboard is onderdeel van Agency.", "The analytics dashboard is part of Agency.")} {" "}
        <Link to="/billing" className="underline">
          {text("Upgraden", "Upgrade")}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{text("Agency-overzicht", "Agency overview")}</h1>
        <p className="text-sm text-muted-foreground">
          {text("Inzicht in je reisportfolio, kosten en declarabele uitgaven.", "Insights into your trip portfolio, costs and billable expenses.")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={text("Actieve reizen", "Active trips")} value={String(activeTrips)} sub={`${trips.length} ${text("totaal", "total")}`} />
        <Kpi label={text("Reisgenoten", "Travellers")} value={String(travellers)} sub={text("over al je reizen", "across all your trips")} />
        <Kpi label={text("Uitgaven", "Expenses")} value={formatMoney(totalSpent, base)} sub={text("in je basisvaluta", "in your base currency")} />
        <Kpi label={text("Declarabel", "Billable")} value={formatMoney(totalBillable, base)} sub={text("nog te factureren", "to be invoiced")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{text("Budget vs. uitgaven per reis", "Budget vs expenses per trip")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perTrip}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="budget" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name={text("Uitgaven", "Expenses")} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{text("Uitgaven per categorie", "Expenses by category")} ({base})</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={perCategory} dataKey="value" nameKey="name" outerRadius={95} label>
                  {perCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function categoryLabel(id: string, fallback: string, text: (nl: string, en: string) => string) {
  const labels: Record<string, string> = {
    transport: "Transport", lodging: "Accommodation", food: "Food and drink",
    activities: "Activities", shopping: "Shopping", other: "Other",
  };
  return text(fallback, labels[id] ?? fallback);
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="surface">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
