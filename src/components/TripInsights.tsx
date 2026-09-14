import { BarChart3, CalendarDays, MapPinned, Moon, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES, type Trip } from "@/lib/types";
import { calculateTripStatistics } from "@/lib/trip-statistics";
import { convert, formatMoney, type Rates } from "@/lib/services";

export function TripInsights({ trip, base, rates, text }: { trip: Trip; base: string; rates: Rates; text: (nl: string, en: string) => string }) {
  const stats = calculateTripStatistics(trip, (amount, currency) => convert(amount, currency, base, rates));
  const categoryName = (id: string) => {
    const nl = CATEGORIES.find((category) => category.id === id)?.label ?? id;
    const en: Record<string, string> = { transport: "Transport", lodging: "Accommodation", food: "Food and drink", activities: "Activities", shopping: "Shopping", other: "Other" };
    return text(nl, en[id] ?? nl);
  };
  return <Card className="surface">
    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5"/>{text("Reisstatistieken","Trip insights")}</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Insight icon={CalendarDays} label={text("Reisduur","Trip length")} value={text(`${stats.tripDays} dagen`,`${stats.tripDays} days`)}/>
        <Insight icon={MapPinned} label={text("Route","Route")} value={text(`${stats.destinations} bestemmingen · ${stats.countries} landen`,`${stats.destinations} destinations · ${stats.countries} countries`)}/>
        <Insight icon={Moon} label={text("Overnachtingen","Nights")} value={String(stats.nights)}/>
        <Insight icon={WalletCards} label={text("Gemiddeld per reisdag","Average per elapsed day")} value={stats.elapsedDays ? formatMoney(stats.dailyAverage,base) : text("Nog niet begonnen","Not started")}/>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium">{text("Budgettempo","Budget pace")}</p><p className="text-xs text-muted-foreground">{stats.elapsedDays ? text(`${stats.elapsedDays} van ${stats.tripDays} reisdagen verstreken`,`${stats.elapsedDays} of ${stats.tripDays} trip days elapsed`) : text("De prognose start op de vertrekdag.","The forecast starts on departure day.")}</p></div><strong>{formatMoney(stats.spent,base)}</strong></div>
          <Progress value={trip.budget > 0 ? Math.min(100,(stats.spent/trip.budget)*100) : 0}/>
          <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted/50 p-3"><span className="text-xs text-muted-foreground">{text("Resterend","Remaining")}</span><p className={stats.remaining<0?"font-semibold text-destructive":"font-semibold"}>{formatMoney(stats.remaining,base)}</p></div><div className="rounded-xl bg-muted/50 p-3"><span className="text-xs text-muted-foreground">{text("Prognose totaal","Projected total")}</span><p className={stats.projectedDifference<0?"font-semibold text-destructive":"font-semibold"}>{formatMoney(stats.projectedTotal,base)}</p></div></div>
        </div>
        <div className="space-y-3"><p className="text-sm font-medium">{text("Uitgaven per categorie","Expenses by category")}</p>{stats.categoryTotals.length===0?<p className="text-sm text-muted-foreground">{text("Voeg een uitgave toe om de verdeling te zien.","Add an expense to see the breakdown.")}</p>:stats.categoryTotals.map((row)=><div key={row.category} className="space-y-1"><div className="flex justify-between gap-3 text-sm"><span>{categoryName(row.category)}</span><span>{formatMoney(row.amount,base)} · {Math.round(row.percentage)}%</span></div><Progress value={row.percentage}/></div>)}</div>
      </div>
    </CardContent>
  </Card>;
}

function Insight({icon:Icon,label,value}:{icon:typeof CalendarDays;label:string;value:string}){return <div className="rounded-xl border bg-background/50 p-4"><Icon className="mb-3 size-5 text-primary"/><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>}
