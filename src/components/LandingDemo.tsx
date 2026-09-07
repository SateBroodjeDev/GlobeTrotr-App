import { useState } from "react";
import { ArrowRight, Check, MapPin, Plane, Wallet, CalendarDays } from "lucide-react";
import { useLocale } from "@/lib/locale";

export function LandingDemo() {
  const { text, locale } = useLocale();
  const [view, setView] = useState("route");
  const [day, setDay] = useState(0);
  const [packed, setPacked] = useState(false);
  const stops = ["Oslo", "Bergen", "Flåm"];
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
  return (
    <div id="demo" className="min-w-0 scroll-mt-24 rounded-3xl border border-primary/20 bg-background/95 p-4 shadow-2xl shadow-primary/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-widest text-primary">{text("Probeer het zelf", "Try it out")}</p><h2 className="mt-1 font-display text-xl font-semibold">Nordic escape</h2></div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{text("Interactieve demo", "Interactive demo")}</span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1" aria-label={text("Demoweergave", "Demo view")}>
        {[
          { id: "route", icon: MapPin, label: text("Route", "Route") },
          { id: "plan", icon: CalendarDays, label: text("Planning", "Itinerary") },
          { id: "cost", icon: Wallet, label: text("Kosten", "Expenses") },
        ].map(({ id, icon: Icon, label }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${view === id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}><Icon className="size-3.5" />{label}</button>)}
      </div>
      <div className="min-h-[290px]">
        {view === "route" && <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-teal-950">
            <svg viewBox="0 0 440 230" className="w-full" role="img" aria-label={text("Schematische voorbeeldroute Oslo, Bergen en Flåm", "Illustrative route through Oslo, Bergen and Flåm")}>
              <defs><pattern id="demo-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#ffffff" strokeOpacity=".06" /></pattern></defs>
              <rect width="440" height="230" fill="url(#demo-grid)" />
              <path d="M60 230L83 174 56 161 111 137 91 101 144 96 133 61 192 68 211 22 258 0H440V230Z" fill="#175349" />
              <path d="M120 171Q160 48 219 100T324 166" fill="none" stroke="#5eead4" strokeWidth="3" strokeDasharray="6 6" />
              {[[120,171,"Bergen"],[219,100,"Flåm"],[324,166,"Oslo"]].map(([x,y,label]) => <g key={label}><circle cx={x} cy={y} r="12" fill="#5eead4" fillOpacity=".16"/><circle cx={x} cy={y} r="5" fill="#5eead4"/><text x={Number(x)+13} y={Number(y)-12} fill="white" fontSize="13" fontFamily="sans-serif">{label}</text></g>)}
              <text x="20" y="26" fill="#99f6e4" fontSize="10" letterSpacing="3">NORWAY</text>
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-primary" />Oslo <ArrowRight className="size-3" /> Bergen <ArrowRight className="size-3" /> Flåm<span className="ml-auto">{text("7 dagen · 3 reizigers", "7 days · 3 travellers")}</span></div>
        </div>}
        {view === "plan" && <div className="space-y-4">
          <div className="flex gap-2">{stops.map((stop,index) => <button type="button" key={stop} aria-pressed={day === index} onClick={() => setDay(index)} className={`rounded-full border px-3 py-2 text-xs ${day === index ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{stop}</button>)}</div>
          <div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">{text("Een dag in", "A day in")} {stops[day]}</p><h3 className="mt-1 font-medium">{[text("Aankomen & ontdekken", "Arrive & explore"),text("Langs de kleurrijke haven", "Explore the colourful harbour"),text("Met de trein door de fjorden", "Through the fjords by train")][day]}</h3><div className="mt-5 flex gap-3"><Plane className="size-5 text-primary"/><div className="text-sm"><p>10:30 · {text("Op pad", "Head out")}</p><p className="mt-2 text-muted-foreground">{["Oslo Opera House", "Bryggen", "Flåmsbana"][day]}</p></div></div></div>
          <button type="button" aria-pressed={packed} onClick={() => setPacked(!packed)} className="flex w-full items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm"><span className={`grid size-5 place-items-center rounded border ${packed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>{packed && <Check className="size-4"/>}</span>{text("Camera ingepakt", "Camera packed")}</button>
        </div>}
        {view === "cost" && <div className="space-y-3"><div className="rounded-2xl bg-primary/10 p-5"><p className="text-xs text-muted-foreground">{text("Samen uitgegeven", "Total spent together")}</p><p className="mt-1 font-display text-3xl font-semibold">{money(240)}</p><p className="mt-2 text-xs">{money(80)} {text("per persoon", "per person")}</p></div>{[["Alex",160],["Sam",80],["Jamie",0]].map(([name,amount]) => <div key={name} className="flex justify-between border-b border-border py-2 text-sm"><span>{name}</span><span>{money(Number(amount))} {text("betaald", "paid")}</span></div>)}<p className="rounded-xl bg-muted/60 p-3 text-sm">Jamie → Alex <strong className="float-right">{money(80)}</strong></p></div>}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">{text("Voorbeeldgegevens. Klik rond: er wordt niets in je account opgeslagen.", "Sample data. Explore freely: nothing is saved to your account.")}</p>
    </div>
  );
}
