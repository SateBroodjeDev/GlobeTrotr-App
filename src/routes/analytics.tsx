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
import { hasFeature, planOf } from "@/lib/plans";
import { CATEGORIES } from "@/lib/types";
import { convert, formatMoney } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "SaaS analytics — GlobeTrotr" },
      {
        name: "description",
        content: "MRR, actieve workspaces, opslagverbruik en uitgavenverdeling in één dashboard.",
      },
      { property: "og:title", content: "SaaS analytics — GlobeTrotr" },
      {
        property: "og:description",
        content: "Business-inzicht in omzet, conversie en gebruik van je reisplatform.",
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
  const { state, rates } = useWorkspace();
  const allowed = hasFeature(state.plan, "analytics");
  const base = state.baseCurrency;
  const plan = planOf(state.plan);

  const perCategory = CATEGORIES.map((c) => ({
    name: c.label,
    value: state.trips
      .flatMap((t) => t.expenses)
      .filter((e) => e.category === c.id)
      .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
  })).filter((d) => d.value > 0);

  const perTrip = state.trips.map((t) => ({
    name: t.name.length > 18 ? `${t.name.slice(0, 18)}…` : t.name,
    uitgaven: Math.round(
      t.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0),
    ),
    budget: t.budget,
  }));

  const seats = state.members.length;
  const mrr = plan.price * Math.max(1, Math.ceil(seats / 3));
  const storage = state.trips.length * 12 + state.trips.flatMap((t) => t.expenses).length * 3;

  if (!allowed) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
        <Lock className="size-4" /> Het analytics dashboard is onderdeel van Business/Agency.{" "}
        <Link to="/billing" className="underline">
          Upgrade
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">SaaS business analytics</h1>
        <p className="text-sm text-muted-foreground">
          Realtime inzicht in omzet, gebruik en uitgavenpatronen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="MRR" value={formatMoney(mrr, "EUR")} sub="+12% vs vorige maand" />
        <Kpi label="Actieve reizen" value={String(state.trips.length)} sub={`${seats} seats`} />
        <Kpi label="Opslagverbruik" value={`${storage} MB`} sub="van 5 GB" />
        <Kpi label="Trial → betaald" value="24,8%" sub="API latency 118 ms" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget vs. uitgaven per reis</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perTrip}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="budget" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="uitgaven" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Uitgaven per categorie ({base})</CardTitle>
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
