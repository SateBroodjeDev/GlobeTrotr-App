import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingDemo } from "@/components/LandingDemo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";

export const Route=createFileRoute("/demo")({head:()=>({meta:[{title:"Interactive product tour — GlobeTrotr"},{name:"description",content:"Follow a realistic GlobeTrotr trip from route and bookings to itinerary and shared expenses."}]}),component:DemoPage});

function DemoPage(){const{text}=useLocale();const{user}=useAuth();return <div className="space-y-10 pb-8"><section className="mx-auto max-w-3xl text-center"><Badge>{text("Interactieve productrondleiding","Interactive product tour")}</Badge><h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">{text("Volg één reis van route tot verrekening.","Follow one trip from route to settlement.")}</h1><p className="mt-4 text-muted-foreground">{text("Geen losse trucjes, maar een realistisch voorbeeld. Klik door de route, boekingen, dagplanning en kosten van een Scandinavië-reis.","A realistic workflow instead of disconnected widgets. Explore the route, bookings, itinerary and expenses of a Scandinavian trip.")}</p></section><LandingDemo expanded/><section className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">{[text("Werkt direct in je browser","Works directly in your browser"),text("Geen account nodig","No account required"),text("NL en EN beschikbaar","Available in NL and EN"),text("Niets wordt opgeslagen","Nothing is saved")].map(item=><p key={item} className="flex items-center gap-2 rounded-xl border p-4 text-sm"><CheckCircle2 className="size-4 text-primary"/>{item}</p>)}</section><div className="text-center"><Button asChild size="lg"><Link to={user?"/dashboard":"/auth"}>{user?text("Open mijn reizen","Open my trips"):text("Plan mijn eerste reis","Plan my first trip")}<ArrowRight className="size-4"/></Link></Button></div></div>}
