import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarRange,
  Check,
  FileDown,
  Globe2,
  ListChecks,
  MapPinned,
  Plane,
  ReceiptText,
  Share2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingDemo } from "@/components/LandingDemo";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/mogelijkheden")({
  head: () => ({
    meta: [
      { title: "Mogelijkheden — GlobeTrotr" },
      { name: "description", content: "Ontdek routes, planning, boekingen, uitgaven, samenwerking en openbare reisverhalen in GlobeTrotr." },
    ],
  }),
  component: FeaturesPage,
});

const PHASES = [
  { icon: MapPinned, title: ["Bouw je route op de kaart", "Build your route on the map"], copy: ["Zoek plekken wereldwijd, bepaal de volgorde en geef per stop aankomstdatum en verblijfsduur op.", "Search places worldwide, set their order and add an arrival date and stay length to each stop."], points: [["Interactieve routekaart", "Interactive route map"], ["Wereldwijde bestemmingszoeker", "Worldwide destination search"], ["Navigatie per stop", "Navigation for every stop"]] },
  { icon: CalendarRange, title: ["Maak van ideeën een dagplanning", "Turn ideas into a daily itinerary"], copy: ["Combineer eigen plannen met vluchten, verblijf, vervoer en activiteiten in één tijdlijn.", "Combine your own plans with flights, accommodation, transport and activities in one timeline."], points: [["Inklapbare dagen en filters", "Collapsible days and filters"], ["Afteller en weer", "Countdown and weather"], ["Notities bij elk onderdeel", "Notes for every item"]] },
  { icon: Plane, title: ["Bewaar boekingen waar je ze nodig hebt", "Keep bookings where you need them"], copy: ["Vluchtnummers, tijden, locaties, aanbieders en boekingsreferenties reizen mee in je overzicht.", "Flight numbers, times, locations, providers and booking references travel with your itinerary."], points: [["Vluchtinformatie", "Flight information"], ["Verblijf en huurauto", "Accommodation and rental cars"], ["Vervoer en activiteiten", "Transport and activities"]] },
  { icon: WalletCards, title: ["Houd iedere valuta en rekening bij", "Track every currency and expense"], copy: ["Zie budget tegenover werkelijkheid en reken groepskosten eerlijk af met zo min mogelijk overboekingen.", "Compare budget with actual spend and settle group expenses fairly with fewer transfers."], points: [["Meerdere valuta", "Multiple currencies"], ["Verdeling per persoon", "Split per person"], ["Slimme verrekening", "Smart settlement"]] },
  { icon: Users, title: ["Werk samen zonder de controle kwijt te raken", "Collaborate without losing control"], copy: ["Kies per reis wie mag plannen, financiën beheren of alleen meekijken.", "Choose per trip who can plan, manage finances or only view."], points: [["Zes reisrollen", "Six trip roles"], ["Financiële privacy", "Financial privacy"], ["Gedeelde reizen in het dashboard", "Shared trips in the dashboard"]] },
  { icon: Share2, title: ["Maak van je route een reisverhaal", "Turn your route into a travel story"], copy: ["Publiceer een verzorgde pagina met intro, kaart en planning. Voeg desgewenst een PIN toe.", "Publish a polished page with an introduction, map and itinerary. Add a PIN if you wish."], points: [["Eigen omschrijving", "Your own introduction"], ["PIN-bescherming", "PIN protection"], ["Financiën apart aan of uit", "Separate financial sharing control"]] },
] as const;

function FeaturesPage() {
  const { user } = useAuth();
  const { text } = useLocale();
  return (
    <div className="space-y-16 pb-8">
      <header className="aurora overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_.95fr]">
          <div>
            <Badge variant="secondary" className="mb-5 gap-1.5"><Globe2 className="size-3.5" /> {text("Van plannen tot thuiskomen", "From planning to coming home")}</Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{text("Alles wat je reis nodig heeft. Eindelijk bij elkaar.", "Everything your trip needs. Finally together.")}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed opacity-90">{text("GlobeTrotr vervangt de losse spreadsheet, chatberichten en screenshots door één levend reisoverzicht voor de hele groep.", "GlobeTrotr replaces scattered spreadsheets, chat messages and screenshots with one living trip overview for the whole group.")}</p>
            <Button asChild size="lg" className="mt-7"><Link to={user ? "/dashboard" : "/auth"}>{user ? text("Open mijn reizen", "Open my trips") : text("Probeer GlobeTrotr gratis", "Try GlobeTrotr free")}<ArrowRight className="size-4" /></Link></Button>
          </div>
          <LandingDemo />
        </div>
      </header>

      <section>
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">{text("De hele reiscyclus", "The complete trip lifecycle")}</p><h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{text("Van eerste prik op de kaart tot de laatste terugbetaling", "From the first map pin to the final repayment")}</h2></div>
        <div className="mt-9 grid gap-5 lg:grid-cols-2">{PHASES.map(({ icon: Icon, title, copy, points }, index) => <Card key={title[0]} className="surface overflow-hidden"><CardContent className="grid gap-5 p-6 sm:grid-cols-[auto_1fr]"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-6" /></span><div><p className="text-xs font-semibold text-primary">0{index + 1}</p><h3 className="mt-1 font-display text-xl font-semibold">{text(title[0], title[1])}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text(copy[0], copy[1])}</p><ul className="mt-4 grid gap-2 text-xs sm:grid-cols-2">{points.map(point => <li key={point[0]} className="flex gap-2"><Check className="size-3.5 shrink-0 text-primary" />{text(point[0], point[1])}</li>)}</ul></div></CardContent></Card>)}</div>
      </section>

      <section className="rounded-3xl border border-border bg-muted/20 p-6 sm:p-10">
        <div className="grid gap-9 lg:grid-cols-[.8fr_1.2fr]">
          <div><Badge variant="outline">{text("Voor onderweg", "For the road")}</Badge><h2 className="mt-4 font-display text-3xl font-semibold">{text("Je belangrijkste informatie ook op je telefoon", "Your essential information on your phone")}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text("Open je dagplanning, controleer een boeking, vink je paklijst af of voeg direct een uitgave toe.", "Open today's itinerary, check a booking, tick your packing list or add an expense immediately.")}</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{[[ListChecks,text("Paklijst per reis", "Packing list per trip")],[ReceiptText,text("Bonnetjes bij uitgaven", "Receipts with expenses")],[BookOpenCheck,text("Printbare reisgids", "Printable trip guide")],[FileDown,text("CSV-, PDF- en JSON-export", "CSV, PDF and JSON export")]].map(([Icon,label]) => <div key={String(label)} className="flex items-center gap-3 rounded-2xl border bg-background p-4"><Icon className="size-5 text-primary" /><span className="text-sm font-medium">{label as string}</span></div>)}</div>
        </div>
      </section>

      <section><div className="text-center"><h2 className="font-display text-3xl font-semibold">{text("Gemaakt voor jullie manier van reizen", "Made for the way you travel")}</h2></div><div className="mt-7 grid gap-4 md:grid-cols-3"><Audience icon={Users} title={text("Vrienden, koppels en families", "Friends, couples and families")} body={text("Plan samen, voorkom betaalverzoeken-chaos en geef iedereen hetzelfde actuele overzicht.", "Plan together, avoid payment-request chaos and give everyone the same current overview.")} /><Audience icon={Globe2} title={text("Solo en meerdere reizen", "Solo and multiple trips")} body={text("Bewaar komende, huidige en gearchiveerde reizen naast elkaar in één persoonlijk dashboard.", "Keep upcoming, current and archived trips together in one personal dashboard.")} /><Audience icon={BriefcaseBusiness} title={text("Reisadviseurs en agencies", "Travel advisers and agencies")} body={text("Gebruik rollen, branding, declarabele uitgaven, bonnetjes en overzichten voor klantreizen.", "Use roles, branding, billable expenses, receipts and overviews for client trips.")} /></div></section>

      <section className="aurora rounded-3xl px-6 py-11 text-center sm:p-14"><ShieldCheck className="mx-auto size-8 text-primary" /><h2 className="mt-4 font-display text-3xl font-semibold">{text("Begin met een echte reis", "Start with a real trip")}</h2><p className="mx-auto mt-3 max-w-xl text-sm opacity-85">{text("Je kunt gratis starten. Reizen blijven privé totdat jij bewust delen inschakelt.", "You can start for free. Trips remain private until you intentionally enable sharing.")}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link to={user ? "/dashboard" : "/auth"}>{user ? text("Naar mijn dashboard", "Go to my dashboard") : text("Account maken", "Create account")}<ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg"><Link to="/beta-voorwaarden">{text("Zo werkt de beta", "How the beta works")}</Link></Button></div></section>
    </div>
  );
}

function Audience({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return <Card className="surface"><CardContent className="p-6"><Icon className="size-6 text-primary" /><h3 className="mt-4 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></CardContent></Card>;
}

