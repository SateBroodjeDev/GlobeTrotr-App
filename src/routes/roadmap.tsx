import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CircleDot, Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";
import { PUBLIC_ROADMAP } from "@/lib/public-roadmap";

export const Route = createFileRoute("/roadmap")({
  head:()=>({meta:[{title:"Roadmap — GlobeTrotr"},{name:"description",content:"Bekijk waar GlobeTrotr nu en binnenkort aan werkt."}]}),
  component:PublicRoadmapPage,
});

function PublicRoadmapPage(){
  const {text}=useLocale();
  const config={now:{label:text("Nu","Now"),icon:CircleDot},next:{label:text("Hierna","Next"),icon:CalendarClock},later:{label:text("Later","Later"),icon:Compass}} as const;
  return <div className="mx-auto max-w-5xl space-y-8"><header className="aurora rounded-3xl px-6 py-10 sm:px-10 sm:py-14"><Badge variant="secondary" className="mb-4 gap-1.5"><Sparkles className="size-3"/>GlobeTrotr roadmap</Badge><h1 className="font-display text-3xl font-semibold sm:text-5xl">{text("Waar werken we aan?","What are we working on?")}</h1><p className="mt-4 max-w-2xl text-sm opacity-90 sm:text-base">{text("Een openbaar overzicht van de belangrijkste productstappen. Plannen kunnen veranderen door feedback uit de beta.","A public overview of the most important product steps. Plans may change based on beta feedback.")}</p></header><div className="grid gap-4 md:grid-cols-3">{PUBLIC_ROADMAP.map(section=>{const c=config[section.status];const Icon=c.icon;return <Card key={section.status} className="surface"><CardContent className="p-6"><div className="flex items-center gap-2 text-primary"><Icon className="size-5"/><span className="text-xs font-semibold uppercase tracking-wider">{c.label}</span></div><h2 className="mt-4 font-display text-xl font-semibold">{text(section.title[0],section.title[1])}</h2><p className="mt-2 text-sm text-muted-foreground">{text(section.description[0],section.description[1])}</p><ul className="mt-5 space-y-3 text-sm">{section.items.map(item=><li key={item[0]} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"/>{text(item[0],item[1])}</li>)}</ul></CardContent></Card>})}</div></div>;
}
