import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";

type Copy = readonly [string, string];
type Highlight = { icon: LucideIcon; title: Copy; body: Copy };

export function AudiencePage({ badge, title, intro, highlights, workflow }: {
  badge: Copy;
  title: Copy;
  intro: Copy;
  highlights: Highlight[];
  workflow: Copy[];
}) {
  const { text } = useLocale();
  const { user } = useAuth();
  return <div className="space-y-14 pb-8">
    <section className="aurora overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 lg:px-14">
      <Badge variant="secondary">{text(...badge)}</Badge>
      <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-tight sm:text-5xl">{text(...title)}</h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-85 sm:text-lg">{text(...intro)}</p>
      <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to={user ? "/dashboard" : "/register"}>{user ? text("Open mijn reizen", "Open my trips") : text("Gratis beginnen", "Start for free")}<ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/demo">{text("Bekijk de demo", "View the demo")}</Link></Button></div>
    </section>
    <section className="grid gap-4 md:grid-cols-3">{highlights.map(({icon: Icon,title: itemTitle,body}) => <Card key={itemTitle[0]} className="surface"><CardContent className="p-6"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></span><h2 className="mt-5 font-display text-xl font-semibold">{text(...itemTitle)}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text(...body)}</p></CardContent></Card>)}</section>
    <section className="rounded-3xl border bg-card/60 p-6 sm:p-10"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><ShieldCheck className="size-8 text-primary"/><h2 className="mt-4 font-display text-3xl font-semibold">{text("Van idee tot een reis die klopt", "From idea to a trip that works")}</h2><p className="mt-3 text-sm text-muted-foreground">{text("Werk in één gedeeld overzicht, met toegang en privacy die bij iedere rol passen.", "Work in one shared overview, with access and privacy suited to every role.")}</p></div><ol className="space-y-3">{workflow.map((step,index)=><li key={step[0]} className="flex gap-4 rounded-2xl border bg-background p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index+1}</span><span className="pt-1 text-sm font-medium">{text(...step)}</span></li>)}</ol></div></section>
  </div>;
}
