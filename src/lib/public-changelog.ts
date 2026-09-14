export type PublicChangeKind = "new" | "improved" | "fixed" | "secure";

export type PublicChange = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  kind: PublicChangeKind;
};

export type PublicRelease = {
  id: string;
  version: string;
  publishedAt: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  changes: PublicChange[];
};

export const PUBLIC_BETA_STATUS = {
  label: "Internationale testopening",
  labelEn: "International test launch",
  description:
    "GlobeTrotr is geopend voor de eerste groep internationale testers. Reizen plannen, kosten bijhouden en openbaar delen staan centraal in deze test.",
  descriptionEn:
    "GlobeTrotr is open to its first group of international testers, centred on planning, expenses and public trip sharing.",
  unavailable: [
    {
      nl: "Inloggen met Apple, Google of Microsoft",
      en: "Sign in with Apple, Google or Microsoft",
    },
    {
      nl: "Automatische app-e-mails en reisuitnodigingen per e-mail",
      en: "Automated app emails and trip invitations by email",
    },
    {
      nl: "Online afrekenen en abonnementsverwerking via Paddle",
      en: "Online checkout and subscription processing through Paddle",
    },
    {
      nl: "Eigen Agency-domeinen en automatische e-mailbezorging",
      en: "Custom Agency domains and automated email delivery",
    },
  ],
} as const;

/** Public-safe release notes. Never include secrets, private data or internal identifiers. */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    id: "2026-09-14-production-hosting-preparation",
    version: "Beta 0.36",
    publishedAt: "2026-09-14T15:00:00+02:00",
    title: "De productieomgeving staat klaar",
    titleEn: "Production hosting is prepared",
    summary: "De website en achtergrondverwerking zijn voorbereid voor een gescheiden Europese serveropstelling.",
    summaryEn: "The website and background processing are prepared for a separated European server setup.",
    changes: [
      { kind: "secure", title: "Gescheiden web en verwerking", titleEn: "Separated web and processing", description: "De publieke website en achtergrondtaken krijgen elk een eigen serverrol, healthcheck en begrensde netwerktoegang.", descriptionEn: "The public website and background jobs each get a dedicated server role, health check and restricted network access." },
      { kind: "improved", title: "Veilige updates en herstel", titleEn: "Safer updates and recovery", description: "De productieprocedure bevat vaste stappen voor HTTPS, configuratiecontrole, updates en terugzetten bij problemen.", descriptionEn: "The production procedure includes defined steps for HTTPS, configuration checks, updates and recovery when problems occur." },
      { kind: "secure", title: "E-mailbezorging voorbereid", titleEn: "Email delivery prepared", description: "Transactionele berichten kunnen via een afgeschermde Europese serverrelay worden bezorgd, met begrensde afzenders, ontvangers en veilige verbindingscontrole.", descriptionEn: "Transactional messages can be delivered through a protected European server relay with restricted senders, recipients and secure connection checks." },
    ],
  },
  {
    id: "2026-09-14-release-control-and-privacy",
    version: "Beta 0.35",
    publishedAt: "2026-09-14T12:00:00+02:00",
    title: "Meer controle tijdens de beta",
    titleEn: "More control during the beta",
    summary: "Onderhoud, privacyverzoeken en beheer zijn samengebracht voor een veiligere en duidelijkere acceptatietest.",
    summaryEn: "Maintenance, privacy requests and administration come together for a safer and clearer acceptance test.",
    changes: [
      { kind: "improved", title: "Productieomgeving voorbereid", titleEn: "Production environment prepared", description: "De database-opbouw, beheercontrole en scheiding tussen test- en productiegegevens zijn vastgelegd voor de verhuizing.", descriptionEn: "Database setup, administration checks and separation of test and production data are documented for the move." },
      { kind: "improved", title: "Duidelijker proberen en instellen", titleEn: "Clearer to try and configure", description: "De demo gebruikt fictieve voorbeelddata, supportlinks zijn herkenbaarder en de reisomslag heeft een eigen plek met aanbevolen afmetingen.", descriptionEn: "The demo uses fictional sample data, support links are easier to recognise and the trip cover has its own place with recommended dimensions." },
      { kind: "improved", title: "Rustiger op ieder scherm", titleEn: "Calmer on every screen", description: "Navigatie, aanraakknoppen, Engelse prijsteksten en foutmeldingen zijn aangescherpt voor telefoon, tablet en desktop.", descriptionEn: "Navigation, touch controls, English pricing copy and error messages have been refined for phone, tablet and desktop." },
      { kind: "new", title: "Samen de reis afronden", titleEn: "Finish the trip together", description: "Houd per reis gezamenlijke taken bij met een verantwoordelijke en deadline, en vink ze af zodra ze klaar zijn.", descriptionEn: "Track shared tasks per trip with an assignee and due date, and check them off when they are done." },
      { kind: "new", title: "Alles voor vandaag", titleEn: "Everything for today", description: "Bekijk onderweg één rustig overzicht met de planning, boekingen, bestemming, weer, documenten en taken van vandaag.", descriptionEn: "Use one calm on-the-go view for today's schedule, bookings, destination, weather, documents and tasks." },
      { kind: "improved", title: "Meer op de kaart", titleEn: "More on the map", description: "Zie plaatsgebonden boekingen en gekoppelde uitgaven direct naast je route en bestemmingen.", descriptionEn: "See location-based bookings and linked expenses directly alongside your route and destinations." },
      { kind: "new", title: "Een eigen reisomslag", titleEn: "Your own trip cover", description: "Geef iedere reis een eigen foto die veilig op de reis en dashboardkaart wordt getoond.", descriptionEn: "Give each trip its own photo, displayed securely on the trip and dashboard card." },
      { kind: "improved", title: "Persoonlijkere reisgids", titleEn: "A more personal trip guide", description: "Je gekozen reisomslag verschijnt nu ook bovenaan de printbare reisgids.", descriptionEn: "Your selected trip cover now also appears at the top of the printable trip guide." },
      { kind: "new", title: "Reizen naast elkaar", titleEn: "Trips side by side", description: "Vergelijk twee reizen op periode, bestemmingen, boekingen, budget, uitgaven en routevolgorde voordat je een variant kiest.", descriptionEn: "Compare two trips by dates, destinations, bookings, budget, expenses and route order before choosing a variant." },
      { kind: "new", title: "Je route meenemen", titleEn: "Take your route with you", description: "Exporteer bestemmingen in hun huidige volgorde als GPX-bestand voor kaart- en navigatie-apps.", descriptionEn: "Export destinations in their current order as a GPX file for mapping and navigation apps." },
      { kind: "new", title: "Route omkeren", titleEn: "Reverse your route", description: "Draai de volledige volgorde van je bestemmingen gecontroleerd om, met bevestiging voordat de wijziging wordt opgeslagen.", descriptionEn: "Reverse the complete order of your destinations in a controlled action, with confirmation before saving." },
      { kind: "new", title: "Begin met een reisvariant", titleEn: "Start with a trip variant", description: "Dupliceer route, planning en paklijst naar een nieuwe privéreis. Deelnemers, uitgaven, boekingsreferenties en deelinstellingen blijven veilig achter.", descriptionEn: "Duplicate a route, itinerary and packing list into a new private trip. Members, expenses, booking references and sharing settings safely stay behind." },
      { kind: "improved", title: "Rustiger navigeren", titleEn: "Calmer navigation", description: "De publieke hoofdnavigatie focust op de belangrijkste keuzes. Ingelogde reizigers vinden Contact en Status voortaan direct in hun menu.", descriptionEn: "The public navigation now focuses on the main choices. Signed-in travellers can access Contact and Status directly from their menu." },
      { kind: "improved", title: "Een persoonlijker verhaal", titleEn: "A more personal story", description: "Over GlobeTrotr leest nu als één verhaal over de Zwedenreis die het platform begon, met minder losse blokken en meer context.", descriptionEn: "About GlobeTrotr now reads as one story about the Sweden trip that started the platform, with fewer separate blocks and more context." },
      { kind: "improved", title: "Verzorgd tijdens onderhoud", titleEn: "Clearer during maintenance", description: "De onderhoudspagina toont een rustigere kop, de concrete reden, resterende tijd en wat er met je reisgegevens gebeurt.", descriptionEn: "The maintenance page shows a calmer heading, the specific reason, remaining time and what happens to your trip data." },
      { kind: "new", title: "Inzicht in je reisbudget", titleEn: "Understand your trip budget", description: "Bekijk reisduur, bestemmingen, overnachtingen, uitgaven per categorie, daggemiddelde en een budgetprognose in één overzicht.", descriptionEn: "See trip length, destinations, nights, expenses by category, daily average and a budget forecast in one overview." },
      { kind: "new", title: "Je reis in je agenda", titleEn: "Your trip in your calendar", description: "Exporteer dagplanning en boekingen als ICS-bestand naar Apple Calendar, Google Calendar, Outlook en andere agenda-apps.", descriptionEn: "Export itinerary items and bookings as an ICS file for Apple Calendar, Google Calendar, Outlook and other calendar apps." },
      { kind: "secure", title: "Bevestiging bij accountwijzigingen", titleEn: "Sign-in change confirmations", description: "Een aangevraagde e-mailwijziging en een geslaagde wachtwoordwijziging verschijnen als blijvende beveiligingsmelding in je account.", descriptionEn: "A requested email change and an updated sign-in credential now appear as persistent security notifications in your account." },
      { kind: "improved", title: "Gerichter platformbeheer", titleEn: "More focused platform management", description: "Beheerders kunnen feedback beantwoorden, urgente problemen volgen, openbare reizen modereren en de bezorging van in-appmeldingen overzien.", descriptionEn: "Administrators can reply to feedback, track urgent issues, moderate public trips and review in-app notification delivery." },
      { kind: "improved", title: "Beter vindbare publieke pagina's", titleEn: "More discoverable public pages", description: "De belangrijkste pagina's hebben eigen social previews, canonical-links en gestructureerde productinformatie.", descriptionEn: "The main pages now have dedicated social previews, canonical links and structured product information." },
      {kind:"new",title:"Geplande onderhoudspagina",titleEn:"Scheduled maintenance page",description:"Bezoekers zien een duidelijke reden en countdown, terwijl beheerders veilig kunnen inloggen en doorwerken.",descriptionEn:"Visitors see a clear reason and countdown while administrators can sign in securely and continue working."},
      {kind:"new",title:"Privacyverzoek vanuit je account",titleEn:"Privacy requests from your account",description:"Ingelogde gebruikers kunnen een privacyverzoek indienen en daarna de status en antwoordtermijn vanuit hun account volgen.",descriptionEn:"Signed-in users can submit a privacy request and then track its status and response deadline from their account."},
      {kind:"secure",title:"Providerverkeer via GlobeTrotr",titleEn:"Provider traffic through GlobeTrotr",description:"Bestemmingszoekopdrachten lopen via de server, zodat de externe dienst het IP-adres van het gebruikersapparaat niet ontvangt.",descriptionEn:"Destination searches run through the server so the external service does not receive the user's device IP address."},
      {kind:"fixed",title:"Recensies en profielfoto's",titleEn:"Testimonials and profile photos",description:"Recensies geven heldere invoerfeedback en profielfoto's behouden hun natuurlijke verhouding.",descriptionEn:"Testimonials provide clear input feedback and profile photos retain their natural proportions."},
      {kind:"improved",title:"Duidelijker productverhaal",titleEn:"Clearer product story",description:"De homepage laat direct zien welke reischaos GlobeTrotr vervangt en wat één gedeelde reis oplevert.",descriptionEn:"The homepage immediately shows which travel chaos GlobeTrotr replaces and what one shared trip provides."},
      {kind:"new",title:"Reacties op feedback",titleEn:"Replies to feedback",description:"Beheerders kunnen een aanvullende vraag of reactie plaatsen en de indiener krijgt daar gericht bericht van.",descriptionEn:"Administrators can post a follow-up question or reply and the submitter receives a focused notification."},
      {kind:"secure",title:"Moderatie van openbare reizen",titleEn:"Public trip moderation",description:"GlobeTrotr kan een openbare reis gemotiveerd depubliceren; de eigenaar wordt geïnformeerd en de ingreep wordt vastgelegd.",descriptionEn:"GlobeTrotr can unpublish a public trip with a recorded reason; the owner is informed and the action is audited."},
    ],
  },
  {
    id: "2026-09-14-privacy-and-trip-clarity",
    version: "Beta 0.34",
    publishedAt: "2026-09-14T00:08:00+02:00",
    title: "Meer overzicht en sterkere privacy",
    titleEn: "More clarity and stronger privacy",
    summary: "De publieke site leeft meer door actuele reizen, lange reisschermen zijn rustiger en gegevens tussen reisbedrijven zijn strikter geïsoleerd.",
    summaryEn: "The public site feels more alive with current trips, long trip screens are calmer and data is more strictly isolated between travel businesses.",
    changes: [
      {kind:"secure",title:"Offerteprijzen per Agency afgeschermd",titleEn:"Quote pricing isolated per agency",description:"Prijsvarianten zijn alleen zichtbaar binnen de bijbehorende Agency-workspace met het juiste inzagerecht.",descriptionEn:"Pricing variants are only visible inside the matching agency workspace with the correct viewing permission."},
      {kind:"new",title:"Actuele reizen op de homepage",titleEn:"Current trips on the homepage",description:"Bezoekers ontdekken rechtstreeks vanaf de homepage echte openbaar gedeelde reizen.",descriptionEn:"Visitors can discover real publicly shared trips directly from the homepage."},
      {kind:"improved",title:"Europese privacy helder uitgelegd",titleEn:"European privacy clearly explained",description:"De website beschrijft primaire opslag in de EU, applicatieservers in Duitsland en controle over optionele koppelingen.",descriptionEn:"The website explains primary EU storage, application servers in Germany and control over optional connections."},
      {kind:"improved",title:"Rustigere reisschermen",titleEn:"Calmer trip screens",description:"Instellingen en planning zijn per onderwerp verdeeld en lange uitgavenlijsten kunnen worden gezocht en gefilterd.",descriptionEn:"Settings and planning are divided by topic, while long expense lists can be searched and filtered."},
      {kind:"new",title:"Vertalen met menselijke controle",titleEn:"Translation with human review",description:"Corporate Admin kan een Engels concept laten maken en controleert dit zelf voordat het wordt gepubliceerd.",descriptionEn:"Corporate Admin can create an English draft and reviews it before publication."},
    ],
  },
  {
    id: "2026-09-13-governance-and-agency-insight",
    version: "Beta 0.33",
    publishedAt: "2026-09-13T23:52:00+02:00",
    title: "Meer grip voor reisbedrijven en GlobeTrotr",
    titleEn: "More control for travel businesses and GlobeTrotr",
    summary: "Agency-teams krijgen concreet inzicht in offertes en werk, terwijl het platform privacydeadlines, uitrol en incidenten beter bewaakt.",
    summaryEn: "Agency teams gain practical insight into quotes and work while the platform improves oversight of privacy deadlines, rollout and incidents.",
    changes: [
      {kind:"new",title:"Agency-rapportage",titleEn:"Agency reporting",description:"Klanten, actieve reizen, offerteconversie, taken en declarabele kosten staan samen in één rustig overzicht.",descriptionEn:"Clients, active trips, quote conversion, tasks and billable expenses come together in one focused overview."},
      {kind:"new",title:"Instelbare herinneringen",titleEn:"Configurable reminders",description:"Reisbedrijven bepalen zelf hoeveel dagen vooraf taken, offertes en documenten onder de aandacht komen.",descriptionEn:"Travel businesses choose how many days in advance tasks, quotes and documents should receive attention."},
      {kind:"secure",title:"Privacy en incidenten onder controle",titleEn:"Privacy and incidents under control",description:"Privacyverzoeken krijgen een deadline en platformincidenten en gecontroleerde uitrol worden centraal en met auditregistratie beheerd.",descriptionEn:"Privacy requests receive a deadline, while platform incidents and controlled rollouts are managed centrally with audit records."},
      {kind:"improved",title:"Beter vindbare publieke site",titleEn:"More discoverable public site",description:"Een sitemap en zoekmachine-instructies bereiden de website voor op het eigen GlobeTrotr-domein.",descriptionEn:"A sitemap and search engine instructions prepare the website for the GlobeTrotr domain."},
    ],
  },
  {
    id: "2026-09-13-guided-product-story",
    version: "Beta 0.32",
    publishedAt: "2026-09-13T23:06:00+02:00",
    title: "Van losse demo naar een echte productreis",
    titleEn: "From disconnected demo to a real product journey",
    summary: "De homepage en demo vertellen rustiger en concreter hoe één reis van route en boekingen naar planning en verrekening groeit.",
    summaryEn: "The homepage and demo now show more clearly how one trip grows from route and bookings into an itinerary and settlement.",
    changes: [
      { kind: "improved", title: "Interactieve Scandinavië-reis", titleEn: "Interactive Scandinavian trip", description: "De productrondleiding bevat vier werkende stappen met route, boekingen, dagplanning, paklijst en een verrekenactie die direct reageert.", descriptionEn: "The product tour contains four working steps covering route, bookings, itinerary, packing and an immediately responsive settlement action." },
      { kind: "new", title: "Echte recensies", titleEn: "Real testimonials", description: "Beheerders kunnen ervaringen toevoegen en bewust publiceren; de homepage toont uitsluitend goedgekeurde recensies.", descriptionEn: "Administrators can add and deliberately publish experiences; the homepage only shows approved testimonials." },
      { kind: "new", title: "Veilig contact en opvolging", titleEn: "Secure contact and follow-up", description: "Het contactformulier gebruikt spamcontrole en nieuwe berichten kunnen vanuit een afgeschermde beheerinbox worden gezocht, opgevolgd en afgesloten.", descriptionEn: "The contact form uses spam protection and new messages can be searched, followed up and closed from a protected management inbox." },
      { kind: "improved", title: "Iedere pagina een duidelijk doel", titleEn: "A clear purpose for every page", description: "De homepage introduceert het product, de demo laat het echt proberen en Mogelijkheden geeft het volledige overzicht. Prijzen helpt nu kiezen op basis van gebruik.", descriptionEn: "The homepage introduces the product, the demo lets visitors try it and Features provides the complete overview. Pricing now helps people choose based on use." },
      { kind: "improved", title: "Betalen, opzeggen en terugbetalen", titleEn: "Payment, cancellation and refunds", description: "De commerciële en juridische pagina's beschrijven actieve betaalde abonnementen via Paddle, maandelijkse verlenging, opzegging, herroeping en terugbetaling.", descriptionEn: "Commercial and legal pages describe active paid subscriptions through Paddle, monthly renewal, cancellation, withdrawal and refunds." },
      { kind: "improved", title: "Eerlijkere beta-status", titleEn: "More transparent beta status", description: "Verouderde problemen verdwijnen uit de actieve lijst en nog ontbrekende e-mail-, OAuth-, betaal- en domeinkoppelingen blijven zichtbaar.", descriptionEn: "Outdated issues leave the active list while pending email, OAuth, payment and domain integrations remain visible." },
      { kind: "improved", title: "Actuele releasechecklist", titleEn: "Current release checklist", description: "Uitgevoerde migraties en SQL-controles staan apart van de handmatige producttests die nog moeten worden gedaan.", descriptionEn: "Completed migrations and SQL checks are separated from the manual product tests that still need to be performed." },
    ],
  },
  {
    id: "2026-09-13-stability-and-presentation",
    version: "Beta 0.31",
    publishedAt: "2026-09-13T22:27:00+02:00",
    title: "Een duidelijker verhaal en stabielere reiservaring",
    titleEn: "A clearer story and a more stable trip experience",
    summary: "De website laat concreter zien hoe GlobeTrotr reischaos oplost, terwijl gedeelde reizen, oude data, branding en navigatie betrouwbaarder werken.",
    summaryEn: "The website now shows more clearly how GlobeTrotr solves travel chaos, while shared trips, old data, branding and navigation work more reliably.",
    changes: [
      { kind: "new", title: "GlobeTrotr in de praktijk", titleEn: "GlobeTrotr in practice", description: "De homepage toont herkenbare groepsreis-, roadtrip- en Agency-scenario’s en vertelt het persoonlijke oprichtersverhaal.", descriptionEn: "The homepage shows recognisable group trip, road trip and agency scenarios and shares the founder’s personal story." },
      { kind: "fixed", title: "Gedeelde reislinks hersteld", titleEn: "Shared trip links restored", description: "Nederlandse en Engelstalige openbare reislinks gebruiken nu dezelfde veilige pagina en ontbrekende optionele gegevens veroorzaken geen fout meer.", descriptionEn: "Dutch and English public trip links now use the same secure page and missing optional data no longer causes an error." },
      { kind: "fixed", title: "Actuele reizen en huisstijl", titleEn: "Current trips and branding", description: "Verwijderde oude reisdata keert niet terug uit een verouderde cache en na een downgrade verschijnt GlobeTrotr direct weer als huisstijl.", descriptionEn: "Deleted legacy trip data no longer returns from an outdated cache and GlobeTrotr branding returns immediately after a downgrade." },
      { kind: "improved", title: "Rustiger beheer en routekaart", titleEn: "Calmer administration and route map", description: "Corporate Admin gebruikt een compacte zijbalk, dubbele leveranciersnavigatie is verwijderd en de kaart sluit in donkere modus beter aan op de interface.", descriptionEn: "Corporate Admin uses a compact sidebar, duplicate supplier navigation is removed and the map better matches the dark interface." },
      { kind: "fixed", title: "Leesbare interface", titleEn: "Readable interface", description: "Resterende fout gecodeerde leestekens zijn uit de zichtbare interface en release-informatie verwijderd.", descriptionEn: "Remaining incorrectly encoded punctuation has been removed from the visible interface and release information." },
    ],
  },
  {
    id: "2026-09-12-production-readiness",
    version: "Beta 0.30",
    publishedAt: "2026-09-12T12:52:00+02:00",
    title: "Transparante status en het verhaal achter GlobeTrotr",
    titleEn: "Transparent status and the story behind GlobeTrotr",
    summary: "Een publieke statuspagina, het persoonlijke oprichtersverhaal en uitgebreid productiebeheer bereiden GlobeTrotr voor op de volgende testfase.",
    summaryEn: "A public status page, the founder's story and expanded production controls prepare GlobeTrotr for its next testing phase.",
    changes: [
      { kind: "new", title: "Publieke statuspagina", titleEn: "Public status page", description: "Bezoekers kunnen de beschikbaarheid van de website, gegevensdiensten en achtergrondverwerking volgen zonder interne servergegevens te zien.", descriptionEn: "Visitors can follow availability of the website, data services and background processing without seeing internal server details." },
      { kind: "new", title: "Het verhaal van Domenic", titleEn: "Domenic's story", description: "Een nieuwe over-ons-pagina vertelt hoe een droomreis naar Zweden uitgroeide tot GlobeTrotr.", descriptionEn: "A new about page tells how a dream trip to Sweden grew into GlobeTrotr." },
      { kind: "improved", title: "Klaar voor gecontroleerde implementatie", titleEn: "Ready for controlled implementation", description: "Corporate Admin krijgt infrastructuur-, quota-, factuur- en mailboxbeheer plus een blijvende releasechecklist voor de productiecontrole.", descriptionEn: "Corporate Admin gains infrastructure, quota, invoice and mailbox controls plus a persistent release checklist for production verification." },
      { kind: "improved", title: "Professioneler bedrijfsbeheer", titleEn: "More professional business administration", description: "Bedrijfsrechten sturen de beheeromgeving, belangrijke acties vragen extra bevestiging en financiële of auditoverzichten zijn exporteerbaar.", descriptionEn: "Company permissions shape the administration area, important actions require an extra confirmation and financial or audit views can be exported." },
    ],
  },
  {
    id: "2026-09-12-agency-workflow",
    version: "Beta 0.29",
    publishedAt: "2026-09-12T11:55:00+02:00",
    title: "Een complete werkplek voor reisprofessionals",
    titleEn: "A complete workspace for travel professionals",
    summary: "Agency-teams beheren klanten, leveranciers, offertes, taken, documenten en reizen vanuit één beveiligde werkomgeving.",
    summaryEn: "Agency teams manage clients, suppliers, quotes, tasks, documents and trips from one secure workspace.",
    changes: [
      { kind: "new", title: "Van klant tot reis", titleEn: "From client to trip", description: "Klantprofielen, offertes met prijsvarianten en gecontroleerde omzetting naar een reis vormen één doorlopende workflow.", descriptionEn: "Client profiles, quotes with pricing options and controlled conversion into a trip form one continuous workflow." },
      { kind: "new", title: "Leveranciers, taken en documenten", titleEn: "Suppliers, tasks and documents", description: "Teams hergebruiken aanbieders, verdelen deadlines en bewaren reisdocumenten veilig bij de juiste reis.", descriptionEn: "Teams reuse providers, assign deadlines and securely keep travel documents with the correct trip." },
      { kind: "improved", title: "Rollen en huisstijl", titleEn: "Roles and branding", description: "Persoonlijke rechten, Agency-brede toegang, auditgeschiedenis en huisstijl per organisatie of reis werken samen.", descriptionEn: "Personal permissions, agency-wide access, audit history and branding per organisation or trip work together." },
      { kind: "secure", title: "Voorbereid op betrouwbare groei", titleEn: "Prepared for reliable growth", description: "Centrale gebruiksgrenzen, providerstops en gecontroleerde achtergrondtaken bereiden GlobeTrotr voor op de productieomgeving.", descriptionEn: "Central usage limits, provider controls and managed background tasks prepare GlobeTrotr for its production environment." },
    ],
  },
  {
    id: "2026-09-12-notifications-and-collaboration",
    version: "Beta 0.28",
    publishedAt: "2026-09-12T11:45:00+02:00",
    title: "Samenwerken met meldingen die ertoe doen",
    titleEn: "Collaborate with notifications that matter",
    summary: "Uitnodigingen, toegang, reiswijzigingen, deadlines en verrekeningen bereiken gericht de juiste personen zonder onnodige herhaling.",
    summaryEn: "Invitations, access, trip changes, deadlines and settlements reach the right people without unnecessary repetition.",
    changes: [
      { kind: "improved", title: "Eén actuele melding", titleEn: "One current notification", description: "Herhaalde wijzigingen aan reizen, boekingen, uitgaven, documenten en Agency-werk worden overzichtelijk gebundeld.", descriptionEn: "Repeated changes to trips, bookings, expenses, documents and agency work are grouped clearly." },
      { kind: "new", title: "Voorkeuren per reis", titleEn: "Preferences per trip", description: "Iedere deelnemer kiest informatieve updates per onderwerp; toegang, beveiliging en betaalverzoeken blijven altijd actief.", descriptionEn: "Each participant chooses informational updates by topic; access, security and payment requests always remain enabled." },
      { kind: "new", title: "Betaalverzoeken en deadlines", titleEn: "Payment requests and deadlines", description: "Slimme verrekeningen kunnen worden gedeeld en afgerond, terwijl geplande herinneringen verlopen acties netjes sluiten.", descriptionEn: "Smart settlements can be shared and completed while scheduled reminders neatly close expired actions." },
    ],
  },
  {
    id: "2026-09-12-public-experience",
    version: "Beta 0.27",
    publishedAt: "2026-09-12T09:55:00+02:00",
    title: "GlobeTrotr helder uitgelegd",
    titleEn: "GlobeTrotr clearly explained",
    summary: "De vernieuwde publieke website laat reizigers, groepen en reisprofessionals zien wat GlobeTrotr voor hen kan betekenen.",
    summaryEn: "The renewed public website shows travellers, groups and travel professionals what GlobeTrotr can do for them.",
    changes: [
      { kind: "new", title: "Productpagina’s en interactieve demo", titleEn: "Product pages and interactive demo", description: "Iedere doelgroep heeft een eigen pagina, met een veilige demo, support en duidelijke navigatie in Nederlands en Engels.", descriptionEn: "Each audience has its own page with a safe demo, support and clear navigation in Dutch and English." },
      { kind: "improved", title: "Stabiele internationale routes", titleEn: "Stable international routes", description: "Engelstalige URL’s, redirects, metadata, sitemap en bestaande gedeelde links vormen één consistente websitestructuur.", descriptionEn: "English URLs, redirects, metadata, sitemap and existing shared links form one consistent website structure." },
      { kind: "secure", title: "Privacy en accountcontrole", titleEn: "Privacy and account control", description: "Cookiekeuzes, gegevensdownload, accountverwijdering en juridische informatie zijn bereikbaar vanuit een duidelijke account- en websitestructuur.", descriptionEn: "Cookie choices, data download, account deletion and legal information are available through a clear account and website structure." },
    ],
  },  {
    id: "2026-09-09-agency-admin-start",
    version: "Beta 0.26",
    publishedAt: "2026-09-09T18:20:00+02:00",
    title: "Een centrale plek voor Agency-beheer",
    titleEn: "A central place for Agency management",
    summary:
      "Agency-eigenaren krijgen een eigen beheeromgeving en back-ups staan voortaan op de plek waar je ze verwacht.",
    summaryEn:
      "Agency owners now have a dedicated management area, while backups appear where users expect them.",
    changes: [
      {
        kind: "new",
        title: "Agency Admin-overzicht",
        titleEn: "Agency Admin overview",
        description:
          "Echte reis-, leden- en merkgegevens komen samen met snelle ingangen voor branding, team, operatie en abonnement.",
        descriptionEn:
          "Real trip, member and brand data is brought together with quick access to branding, team, operations and plans.",
      },
      {
        kind: "improved",
        title: "Back-ups op een logische plaats",
        titleEn: "Backups in a logical place",
        description:
          "Een reisback-up download je bij de instellingen van die reis; een JSON-back-up importeer je bij je accountinstellingen.",
        descriptionEn:
          "Download a trip backup from that trip's settings and import a JSON backup from account settings.",
      },
      {
        kind: "improved",
        title: "Betrouwbaardere kwaliteitscontrole",
        titleEn: "More reliable quality checks",
        description:
          "De automatische GitHub-controle gebruikt voortaan de dependency-lockfile die daadwerkelijk bij het project hoort.",
        descriptionEn:
          "The automated GitHub check now uses the dependency lockfile that actually belongs to the project.",
      },
    ],
  },
  {
    id: "2026-09-09-invitation-management",
    version: "Beta 0.25",
    publishedAt: "2026-09-09T13:32:00+02:00",
    title: "Uitnodigingen onder controle",
    titleEn: "Invitations under control",
    summary:
      "Reisbeheerders zien openstaande uitnodigingen bij elkaar en kunnen iedere link veilig vernieuwen of intrekken.",
    summaryEn:
      "Trip managers can see pending invitations together and securely renew or revoke each link.",
    changes: [
      {
        kind: "new",
        title: "Overzicht bij Reisgenoten",
        titleEn: "Overview under Travellers",
        description:
          "Openstaande en verlopen uitnodigingen tonen het adres, de rol en de actuele geldigheid zonder de volledige link te bewaren.",
        descriptionEn:
          "Pending and expired invitations show the address, role and current validity without storing the complete link.",
      },
      {
        kind: "improved",
        title: "Veilig een nieuwe link maken",
        titleEn: "Create a new link securely",
        description:
          "Vernieuwen maakt de oude link ongeldig, geeft een nieuwe link en verlengt de uitnodiging met zeven dagen.",
        descriptionEn:
          "Renewing invalidates the old link, provides a new link and extends the invitation by seven days.",
      },
      {
        kind: "secure",
        title: "Uitnodiging volledig intrekken",
        titleEn: "Revoke an invitation completely",
        description:
          "Na bevestiging verdwijnen de open toegang, accountmelding en onbevestigde reisgenoot direct uit beeld.",
        descriptionEn:
          "After confirmation, pending access, the account notification and the unconfirmed traveller disappear immediately.",
      },
    ],
  },
  {
    id: "2026-09-09-admin-dialogs",
    version: "Beta 0.24",
    publishedAt: "2026-09-09T13:21:00+02:00",
    title: "Duidelijker beheer van statussen",
    titleEn: "Clearer status management",
    summary:
      "Platformstoringen en bekende problemen zijn sneller en duidelijker vanuit aparte vensters te beheren.",
    summaryEn:
      "Platform incidents and known issues can now be managed faster and more clearly in dedicated dialogs.",
    changes: [
      {
        kind: "improved",
        title: "Eigen venster voor statusupdates",
        titleEn: "Dedicated window for status updates",
        description:
          "Bijwerken en oplossen opent direct bij de gekozen status. Een oplossing krijgt herkenbare hersteltekst.",
        descriptionEn:
          "Updating and resolving opens directly for the selected status. A resolution receives recognisable recovery text.",
      },
      {
        kind: "improved",
        title: "Problemen bewerken zonder zoeken",
        titleEn: "Edit issues without searching",
        description:
          "Een bekend probleem opent in een popup en verdwijnt na bevestigd archiveren direct uit de actieve lijst.",
        descriptionEn:
          "A known issue opens in a popup and disappears from the active list immediately after confirmed archiving.",
      },
      {
        kind: "fixed",
        title: "Weer en reisback-ups bevestigd",
        titleEn: "Weather and trip backups verified",
        description:
          "Live weer en het importeren en exporteren van reisback-ups zijn in de beta werkend bevestigd.",
        descriptionEn:
          "Live weather and importing and exporting trip backups have been verified in the beta.",
      },
    ],
  },
  {
    id: "2026-09-09-platform-status-banners",
    version: "Beta 0.23",
    publishedAt: "2026-09-09T13:06:00+02:00",
    title: "Actuele platformstatus in beeld",
    titleEn: "Current platform status at a glance",
    summary:
      "Ingelogde gebruikers zien een actuele storing als banner en ontvangen een gewone melding zodra deze is opgelost.",
    summaryEn:
      "Signed-in users see an active incident as a banner and receive a regular notification when it is resolved.",
    changes: [
      {
        kind: "new",
        title: "Wegklikbare statusbanner",
        titleEn: "Dismissible status banner",
        description:
          "Informatie, waarschuwingen en kritieke platformstatussen staan zichtbaar boven het reisplatform en kunnen persoonlijk worden gesloten.",
        descriptionEn:
          "Information, warnings and critical platform statuses appear above the travel platform and can be dismissed individually.",
      },
      {
        kind: "improved",
        title: "Status bijwerken en oplossen",
        titleEn: "Update and resolve a status",
        description:
          "Een vervolg vervangt de eerdere banner. Bij opgelost verdwijnt de banner en verschijnt de oplossing als melding rechtsboven.",
        descriptionEn:
          "A follow-up replaces the previous banner. Once resolved, the banner disappears and the resolution appears as a notification in the top right.",
      },
      {
        kind: "new",
        title: "Berichtgeschiedenis voor beheer",
        titleEn: "Message history for administrators",
        description:
          "Corporate Admin houdt actuele statussen en eerdere platformberichten overzichtelijk bij.",
        descriptionEn:
          "Corporate Admin keeps current statuses and previous platform messages organised.",
      },
    ],
  },
  {
    id: "2026-09-09-reliability-recovery",
    version: "Beta 0.22",
    publishedAt: "2026-09-09T12:48:00+02:00",
    title: "Betrouwbaarder samenwerken en herstellen",
    titleEn: "More reliable collaboration and recovery",
    summary:
      "Weigeren, platformupdates, live weer en het terugzetten van reisback-ups zijn robuuster gemaakt.",
    summaryEn:
      "Declining invitations, platform updates, live weather and restoring trip backups are now more robust.",
    changes: [
      {
        kind: "improved",
        title: "Samenwerking praktisch bevestigd",
        titleEn: "Collaboration verified in practice",
        description:
          "Accepteren, verwijderen, antwoord- en verwijdermeldingen, samengevoegde reisupdates, feedbackmeldingen en de herkenbare auditlog zijn in de beta gecontroleerd.",
        descriptionEn:
          "Acceptance, removal, response and removal notifications, combined trip updates, feedback notifications and the identifiable audit log have been verified in the beta.",
      },
      {
        kind: "fixed",
        title: "Geweigerde uitnodiging verdwijnt",
        titleEn: "Declined invitation disappears",
        description:
          "Na weigeren blijft de persoon niet meer als uitgenodigd in de reisgenotenlijst staan.",
        descriptionEn:
          "After declining, the person no longer remains listed as invited among the trip members.",
      },
      {
        kind: "improved",
        title: "Weer met automatische terugval",
        titleEn: "Weather with automatic fallback",
        description:
          "Als de primaire weerbron tijdelijk niet bereikbaar is, schakelt GlobeTrotr automatisch over op een tweede bron.",
        descriptionEn:
          "If the primary weather source is temporarily unavailable, GlobeTrotr automatically switches to a second source.",
      },
      {
        kind: "fixed",
        title: "Reisback-up direct importeren",
        titleEn: "Import a trip backup directly",
        description:
          "Een nieuwe reis is tijdens de import meteen beschikbaar om de veilige back-upinhoud op te slaan.",
        descriptionEn:
          "A new trip is immediately available during import so its safe backup content can be saved.",
      },
      {
        kind: "new",
        title: "Back-up per reis",
        titleEn: "Backup per trip",
        description:
          "Naast de volledige back-up heeft iedere reiskaart nu een eigen JSON-back-upknop.",
        descriptionEn:
          "Alongside the complete backup, every trip card now has its own JSON backup button.",
      },
      {
        kind: "fixed",
        title: "Platformupdates publiceren",
        titleEn: "Publish platform updates",
        description:
          "Corporate Admin publiceert een update en de bijbehorende accountmeldingen voortaan als één betrouwbare handeling.",
        descriptionEn:
          "Corporate Admin now publishes an update and its account notifications as one reliable operation.",
      },
    ],
  },
  {
    id: "2026-09-09-trip-backup-import",
    version: "Beta 0.21",
    publishedAt: "2026-09-09T12:32:00+02:00",
    title: "Je reisback-up weer terugzetten",
    titleEn: "Restore your trip backup",
    summary:
      "Een GlobeTrotr JSON-back-up kan nu vanuit het reisoverzicht veilig als nieuwe reizen worden geïmporteerd.",
    summaryEn:
      "A GlobeTrotr JSON backup can now be imported safely as new trips from the trip overview.",
    changes: [
      {
        kind: "new",
        title: "JSON-import voor reizen",
        titleEn: "JSON import for trips",
        description:
          "Route, planning, boekingen, uitgaven en paklijst worden hersteld met nieuwe reis-ID’s, zonder bestaande reizen te overschrijven.",
        descriptionEn:
          "Routes, itinerary, bookings, expenses and packing lists are restored with new trip IDs without overwriting existing trips.",
      },
      {
        kind: "secure",
        title: "Privé en veilig teruggezet",
        titleEn: "Restored privately and safely",
        description:
          "Geïmporteerde reizen starten privé; oude accountkoppelingen, deel-PINs en bonpaden worden niet overgenomen.",
        descriptionEn:
          "Imported trips start privately; old account links, sharing PINs and receipt paths are not restored.",
      },
    ],
  },
  {
    id: "2026-09-09-complete-notification-cycle",
    version: "Beta 0.20",
    publishedAt: "2026-09-09T12:28:00+02:00",
    title: "Meldingen die je echt bijpraten",
    titleEn: "Notifications that keep you informed",
    summary:
      "Reizigers krijgen gerichte updates over hun reizen, feedback en belangrijke gebeurtenissen binnen GlobeTrotr.",
    summaryEn:
      "Travellers receive focused updates about their trips, feedback and important GlobeTrotr events.",
    changes: [
      {
        kind: "improved",
        title: "Eén melding per gewijzigde reis",
        titleEn: "One notification per updated trip",
        description:
          "Meerdere wijzigingen worden samengevoegd tot één actuele melding per reis.",
        descriptionEn:
          "Multiple changes are combined into one current notification per trip.",
      },
      {
        kind: "new",
        title: "Feedback en deelname volgen",
        titleEn: "Track feedback and participation",
        description:
          "Je krijgt bericht bij een nieuwe feedbackstatus en wanneer je uit een reis bent verwijderd.",
        descriptionEn:
          "You are notified when feedback receives a new status and when you are removed from a trip.",
      },
      {
        kind: "new",
        title: "Belangrijke GlobeTrotr-berichten",
        titleEn: "Important GlobeTrotr messages",
        description:
          "Actuele platformstatus en belangrijke productupdates verschijnen rechtstreeks bij ingelogde gebruikers.",
        descriptionEn:
          "Current platform status and important product updates appear directly for signed-in users.",
      },
    ],
  },
  {
    id: "2026-09-09-invitation-feedback-weather",
    version: "Beta 0.19",
    publishedAt: "2026-09-09T12:20:00+02:00",
    title: "Duidelijke uitnodigingen en betrouwbaarder weer",
    titleEn: "Clear invitations and more reliable weather",
    summary:
      "Reisuitnodigingen hebben nu één duidelijke status en de uitnodiger krijgt bericht over het antwoord.",
    summaryEn:
      "Trip invitations now have one clear status and the inviter is notified about the response.",
    changes: [
      {
        kind: "improved",
        title: "Antwoord zichtbaar voor de uitnodiger",
        titleEn: "Response visible to the inviter",
        description:
          "Bij accepteren of weigeren ontvangt de uitnodiger een melding met een directe link naar de reis.",
        descriptionEn:
          "When an invitation is accepted or declined, the inviter receives a notification with a direct trip link.",
      },
      {
        kind: "fixed",
        title: "Geen handmatige schijnstatus",
        titleEn: "No manual placeholder status",
        description:
          "Alleen de genodigde kan deelname accepteren of weigeren; overbodige handmatige statusknoppen zijn verwijderd.",
        descriptionEn:
          "Only the invitee can accept or decline participation; redundant manual status controls have been removed.",
      },
      {
        kind: "fixed",
        title: "Weer via een stabiele serververbinding",
        titleEn: "Weather through a stable server connection",
        description:
          "De weerwidget gebruikt een beveiligde serveraanroep en de actuele gegevensvelden van de weerprovider.",
        descriptionEn:
          "The weather widget uses a secured server request and the provider's current data fields.",
      },
    ],
  },
  {
    id: "2026-09-09-trip-member-cleanup",
    version: "Beta 0.18",
    publishedAt: "2026-09-09T12:13:00+02:00",
    title: "Een duidelijke lijst met reisgenoten",
    titleEn: "A clear traveller list",
    summary:
      "Geaccepteerde reisgenoten staan voortaan één keer in de lijst en kunnen door de reiseigenaar volledig worden verwijderd.",
    summaryEn:
      "Accepted travellers now appear once in the list and can be removed completely by the trip owner.",
    changes: [
      {
        kind: "fixed",
        title: "Geen dubbele reisgenoten",
        titleEn: "No duplicate travellers",
        description:
          "Oude uitnodigingsregels worden bij acceptatie automatisch opgeruimd.",
        descriptionEn:
          "Old invitation entries are now cleaned up automatically after acceptance.",
      },
      {
        kind: "fixed",
        title: "Verwijderen werkt definitief",
        titleEn: "Removal is permanent",
        description:
          "Een verwijderde reisgenoot verdwijnt uit de reis en openstaande uitnodigingen voor die deelname worden ingetrokken.",
        descriptionEn:
          "A removed traveller leaves the trip and any pending invitations for that membership are revoked.",
      },
    ],
  },
  {
    id: "2026-09-09-secure-trip-invitations",
    version: "Beta 0.17",
    publishedAt: "2026-09-09T01:40:00+02:00",
    title: "Zelf kiezen bij een reisuitnodiging",
    titleEn: "Choose how to respond to a trip invitation",
    summary:
      "Reisuitnodigingen werken nu via één beveiligde route met een duidelijke keuze om deel te nemen of te weigeren.",
    summaryEn: "Trip invitations now use one secure flow with a clear choice to join or decline.",
    changes: [
      {
        kind: "new",
        title: "Beveiligde uitnodigingslink",
        titleEn: "Secure invitation link",
        description:
          "Een reisbeheerder kan na het toevoegen van een reisgenoot direct een zeven dagen geldige link kopiëren en delen.",
        descriptionEn:
          "After adding a traveller, a trip manager can immediately copy and share a link that remains valid for seven days.",
      },
      {
        kind: "new",
        title: "Accepteren of weigeren",
        titleEn: "Accept or decline",
        description:
          "De genodigde ziet de reis en aangeboden rol en beslist zelf of die wil deelnemen.",
        descriptionEn: "The invitee sees the trip and offered role and decides whether to join.",
      },
      {
        kind: "new",
        title: "Antwoorden vanuit meldingen",
        titleEn: "Respond from notifications",
        description:
          "Bestaande accounts kunnen een reisuitnodiging rechtstreeks vanuit hun meldingen accepteren of weigeren.",
        descriptionEn:
          "Existing accounts can accept or decline a trip invitation directly from their notifications.",
      },
      {
        kind: "secure",
        title: "Toegang pas na acceptatie",
        titleEn: "Access only after acceptance",
        description:
          "Alleen het account met het bevestigde uitgenodigde e-mailadres kan deelnemen; toevoegen alleen verleent geen toegang.",
        descriptionEn:
          "Only the account with the confirmed invited email address can join; being added alone does not grant access.",
      },
      {
        kind: "improved",
        title: "Registreren vanuit een uitnodiging",
        titleEn: "Register from an invitation",
        description:
          "Nieuwe gebruikers keren na accountbevestiging terug naar dezelfde uitnodiging om hun keuze af te ronden.",
        descriptionEn:
          "New users return to the same invitation after confirming their account to complete their choice.",
      },
    ],
  },
  {
    id: "2026-09-09-theme-and-member-recognition",
    version: "Beta 0.16",
    publishedAt: "2026-09-09T00:15:00+02:00",
    title: "Rustiger vernieuwen en betere herkenning",
    titleEn: "Smoother refreshes and better recognition",
    summary:
      "De gekozen weergave blijft rustig staan en bestaande reisgenoten ontvangen betrouwbaar de juiste uitnodiging.",
    summaryEn:
      "Your chosen appearance stays stable and existing travellers reliably receive the right invitation.",
    changes: [
      {
        kind: "fixed",
        title: "Donkere modus zonder witte flits",
        titleEn: "Dark mode without a white flash",
        description:
          "De gekozen weergave wordt bij vernieuwen toegepast voordat de pagina zichtbaar wordt.",
        descriptionEn:
          "The selected appearance is applied on refresh before the page becomes visible.",
      },
      {
        kind: "fixed",
        title: "Bestaande reisgenoten correct herkend",
        titleEn: "Existing travellers recognised correctly",
        description:
          "Een bestaand account ontvangt bij een exact overeenkomend reisgenootadres betrouwbaar een uitnodiging en kiest daarna zelf of het deelneemt.",
        descriptionEn:
          "An existing account reliably receives an invitation when its email exactly matches the traveller address and then chooses whether to join.",
      },
    ],
  },
  {
    id: "2026-09-09-platform-administration",
    version: "Beta 0.15",
    publishedAt: "2026-09-08T23:30:00+02:00",
    title: "Veiliger accountbeheer",
    titleEn: "Safer account administration",
    summary:
      "Geautoriseerd platformbeheer heeft meer inzicht in accounts en kan noodzakelijke correcties gecontroleerd uitvoeren.",
    summaryEn:
      "Authorised platform administration has better account insights and can make necessary corrections in a controlled way.",
    changes: [
      {
        kind: "improved",
        title: "Beter accountbeheer",
        titleEn: "Better account administration",
        description:
          "Geautoriseerd beheer kan accountinstellingen gecontroleerd corrigeren en gebruikersdetails met reis- en workspaceactiviteit bekijken.",
        descriptionEn:
          "Authorised administration can correct account settings in a controlled way and review user details with trip and workspace activity.",
      },
      {
        kind: "secure",
        title: "Veilige accountblokkering",
        titleEn: "Secure account blocking",
        description:
          "Een account kan gecontroleerd worden geblokkeerd en hersteld met een verplichte reden en extra bevestiging.",
        descriptionEn:
          "An account can be blocked and restored in a controlled way with a required reason and extra confirmation.",
      },
      {
        kind: "improved",
        title: "Duidelijke melding bij accountblokkering",
        titleEn: "Clear account blocking message",
        description:
          "Geblokkeerde gebruikers krijgen een Nederlandse of Engelse uitleg met het juiste contactadres.",
        descriptionEn:
          "Blocked users receive a Dutch or English explanation with the correct contact address.",
      },
    ],
  },
  {
    id: "2026-09-08-platform-health-and-audit",
    version: "Beta 0.14",
    publishedAt: "2026-09-08T23:00:00+02:00",
    title: "Bewaakte platformstatus",
    titleEn: "Monitored platform status",
    summary:
      "Technische diensten en belangrijke beheeracties kunnen vanuit een afgeschermde omgeving worden gecontroleerd.",
    summaryEn:
      "Technical services and important administration actions can be checked from a restricted environment.",
    changes: [
      {
        kind: "secure",
        title: "Extra beveiliging voor platformbeheer",
        titleEn: "Additional platform administration security",
        description:
          "Beheertoegang wordt extra gecontroleerd en belangrijke beheeracties worden vastgelegd.",
        descriptionEn:
          "Administration access receives an additional check and important admin actions are recorded.",
      },
      {
        kind: "secure",
        title: "Bewaakte platformstatus",
        titleEn: "Monitored platform status",
        description:
          "Beheer kan belangrijke technische diensten veilig controleren zonder vluchtquotum te verbruiken.",
        descriptionEn:
          "Administration can safely check important technical services without consuming flight quota.",
      },
    ],
  },
  {
    id: "2026-09-08-administration-navigation",
    version: "Beta 0.13",
    publishedAt: "2026-09-08T22:30:00+02:00",
    title: "Duidelijke beheeromgeving en roadmap",
    titleEn: "Clear administration environment and roadmap",
    summary:
      "Platformbeheer heeft eigen pagina's en bezoekers kunnen de productrichting via een openbare roadmap volgen.",
    summaryEn:
      "Platform administration has dedicated pages and visitors can follow product direction through a public roadmap.",
    changes: [
      {
        kind: "improved",
        title: "Eigen beheerpagina's",
        titleEn: "Dedicated administration pages",
        description:
          "Gebruikers, status, feedback, problemen en auditinformatie hebben ieder een compacte beheerpagina.",
        descriptionEn:
          "Users, status, feedback, issues and audit information each have a compact administration page.",
      },
      {
        kind: "improved",
        title: "Aparte beheeromgeving",
        titleEn: "Separate administration environment",
        description:
          "Platformbeheer heeft een eigen rustige navigatie, los van reizen en Agency-onderdelen.",
        descriptionEn:
          "Platform administration has its own focused navigation, separate from trips and Agency sections.",
      },
      {
        kind: "new",
        title: "Openbare roadmap",
        titleEn: "Public roadmap",
        description: "Bekijk waar GlobeTrotr nu aan werkt en welke verbeteringen hierna volgen.",
        descriptionEn: "See what GlobeTrotr is working on now and which improvements come next.",
      },
      {
        kind: "improved",
        title: "Compactere navigatie",
        titleEn: "More compact navigation",
        description:
          "De footer groepeert belangrijke pagina's en herkenbare iconen maken informatie sneller vindbaar.",
        descriptionEn:
          "The footer groups important pages and recognisable icons make information easier to find.",
      },
    ],
  },
  {
    id: "2026-09-08-beta-feedback",
    version: "Beta 0.12",
    publishedAt: "2026-09-08T16:10:00+02:00",
    title: "Feedback direct vanuit GlobeTrotr",
    titleEn: "Feedback directly from GlobeTrotr",
    summary:
      "Betatesters kunnen sneller problemen melden en de voortgang volgen via een openbare lijst.",
    summaryEn: "Beta testers can report problems faster and follow progress through a public list.",
    changes: [
      {
        kind: "new",
        title: "Feedbackknop op iedere pagina",
        titleEn: "Feedback button on every page",
        description:
          "Ingelogde testers kunnen via de vaste zijknop feedback insturen en daarbij een duidelijke categorie kiezen.",
        descriptionEn:
          "Signed-in testers can submit feedback through the fixed side button and select a clear category.",
      },
      {
        kind: "new",
        title: "Openbare lijst met bekende problemen",
        titleEn: "Public known-issues list",
        description:
          "Bekijk per categorie welke problemen worden onderzocht, gepland of gemonitord.",
        descriptionEn:
          "See by category which problems are being investigated, planned or monitored.",
      },
      {
        kind: "improved",
        title: "Sneller beheer van beta-feedback",
        titleEn: "Faster beta feedback management",
        description:
          "Het beheer gebruikt zoeken, categoriefilters en een duidelijk overzicht van open werk.",
        descriptionEn:
          "Administration now offers search, category filters and a clear overview of open work.",
      },
      {
        kind: "improved",
        title: "Privacykeuzes op de juiste plek",
        titleEn: "Privacy choices in the right place",
        description:
          "Ingelogde gebruikers beheren browseropslag in Accountinstellingen; gasten gebruiken de footer.",
        descriptionEn:
          "Signed-in users manage browser storage in Account settings; guests use the footer.",
      },
    ],
  },
  {
    id: "2026-09-08-privacy-controls",
    version: "Beta 0.11",
    publishedAt: "2026-09-08T15:20:00+02:00",
    title: "Duidelijke privacykeuzes",
    titleEn: "Clear privacy choices",
    summary:
      "Je ziet precies welke browseropslag GlobeTrotr gebruikt en houdt zelf controle over optionele voorkeuren.",
    summaryEn:
      "You can see exactly which browser storage GlobeTrotr uses and control optional preferences.",
    changes: [
      {
        kind: "new",
        title: "Privacykeuze bij eerste bezoek",
        titleEn: "Privacy choice on first visit",
        description:
          "Noodzakelijke opslag wordt helder uitgelegd en optionele taalopslag staat standaard uit. Je kunt je keuze later via de footer wijzigen.",
        descriptionEn:
          "Necessary storage is clearly explained and optional language storage is off by default. You can change your choice later through the footer.",
      },
      {
        kind: "improved",
        title: "Volledige privacy- en opslaguitleg",
        titleEn: "Complete privacy and storage information",
        description:
          "De privacyverklaring vermeldt gegevensdoelen, grondslagen, ontvangers, bewaartermijnen, rechten en alle gebruikte browseropslag.",
        descriptionEn:
          "The privacy notice lists data purposes, legal bases, recipients, retention, rights and all browser storage used.",
      },
      {
        kind: "improved",
        title: "Duidelijke beta-voorwaarden",
        titleEn: "Clear beta terms",
        description:
          "Deelname, veilig gebruik, reiscontroles, gebruikersinhoud en consumentenrechten zijn nu helder uitgewerkt.",
        descriptionEn:
          "Participation, safe use, travel checks, user content and consumer rights are now clearly explained.",
      },
    ],
  },
  {
    id: "2026-09-08-security-hardening",
    version: "Beta 0.10",
    publishedAt: "2026-09-08T14:42:00+02:00",
    title: "Veiligere exports en eerlijk API-gebruik",
    titleEn: "Safer exports and fair API usage",
    summary:
      "Exports, vluchtcontroles en gegevens van reisgenoten hebben extra bescherming gekregen.",
    summaryEn: "Exports, flight checks and traveller data now have additional safeguards.",
    changes: [
      {
        kind: "secure",
        title: "Veilige CSV-bestanden",
        titleEn: "Safe CSV files",
        description:
          "Tekst uit reisuitgaven kan bij openen in een spreadsheet niet meer als formule worden uitgevoerd.",
        descriptionEn:
          "Text from trip expenses can no longer execute as a formula when opened in a spreadsheet.",
      },
      {
        kind: "secure",
        title: "Beschermde vluchtcontroles",
        titleEn: "Protected flight checks",
        description:
          "Alleen ingelogde gebruikers kunnen live vluchtinformatie opvragen, met een redelijke limiet per account.",
        descriptionEn:
          "Only signed-in users can request live flight information, with a reasonable per-account limit.",
      },
      {
        kind: "secure",
        title: "Meer privacy voor reisgenoten",
        titleEn: "More privacy for travellers",
        description:
          "Samenwerkende reisgenoten kunnen niet rechtstreeks de e-mailadressen van alle andere leden uitlezen.",
        descriptionEn:
          "Trip collaborators can no longer directly read every other member's email address.",
      },
    ],
  },
  {
    id: "2026-09-08-actual-fuel-costs",
    version: "Beta 0.9",
    publishedAt: "2026-09-08T14:34:00+02:00",
    title: "Slimmere vervoers- en brandstofkosten",
    titleEn: "Smarter transport and fuel costs",
    summary:
      "Tankuitgaven en de brandstofprognose van een autorit werken nu als één duidelijke berekening.",
    summaryEn:
      "Fuel expenses and a drive's fuel estimate now work together as one clear calculation.",
    changes: [
      {
        kind: "new",
        title: "Kies hoe je reist",
        titleEn: "Choose how you travel",
        description:
          "Leg per rit vast of je met auto, motor, camper, OV, trein, bus, veerboot, taxi, fiets of te voet reist. Alleen eigen brandstofvoertuigen tonen een literprognose.",
        descriptionEn:
          "Record whether you travel by car, motorcycle, camper, public transport, train, bus, ferry, taxi, bicycle or on foot. Only personal fuel vehicles show a fuel estimate.",
      },
      {
        kind: "secure",
        title: "Boekingen bewust openbaar delen",
        titleEn: "Share bookings intentionally",
        description:
          "Kies per reisonderdeel of een veilige samenvatting op de openbare reispagina verschijnt. Boekingsnummers, prijzen, notities en live vluchtgegevens blijven privé.",
        descriptionEn:
          "Choose per travel item whether a safe summary appears on the public trip page. Booking references, prices, notes and live flight data remain private.",
      },
      {
        kind: "improved",
        title: "Weer bij de openbare route",
        titleEn: "Weather along the public route",
        description:
          "Openbare Pro- en Agency-reizen tonen het weer voor de bestemming die een bezoeker op de route selecteert.",
        descriptionEn:
          "Public Pro and Agency trips show the weather for the destination a visitor selects along the route.",
      },
      {
        kind: "improved",
        title: "Werkelijke brandstofkosten zonder dubbeltelling",
        titleEn: "Actual fuel costs without double counting",
        description:
          "Koppel één of meer tankuitgaven aan een autorit. GlobeTrotr vervangt dan automatisch de brandstofprognose van die rit.",
        descriptionEn:
          "Link one or more fuel expenses to a drive. GlobeTrotr then automatically replaces that drive's fuel estimate.",
      },
    ],
  },
  {
    id: "2026-09-08-beta-experience-privacy-controls",
    version: "Beta 0.8",
    publishedAt: "2026-09-08T01:15:00+02:00",
    title: "Een mooiere start en meer controle",
    titleEn: "A better start and more control",
    summary:
      "De beta legt nu beter uit wat GlobeTrotr kan en geeft je rechtstreeks controle over je accountgegevens.",
    summaryEn:
      "The beta now presents GlobeTrotr more clearly and gives you direct control over your account data.",
    changes: [
      {
        kind: "fixed",
        title: "Homepage opent weer betrouwbaar",
        titleEn: "Homepage opens reliably again",
        description:
          "Een conflict met het kaarticoon dat een leeg scherm kon veroorzaken is opgelost.",
        descriptionEn: "A map icon conflict that could cause a blank screen has been resolved.",
      },
      {
        kind: "secure",
        title: "Veilige openbare reisgegevens",
        titleEn: "Safe public trip data",
        description:
          "Homepage en gedeelde reizen ontvangen alleen de route- en planningsvelden die bewust openbaar zijn gemaakt.",
        descriptionEn:
          "The homepage and shared trips receive only route and itinerary fields that were intentionally made public.",
      },
      {
        kind: "fixed",
        title: "Kosten blijven bij de juiste reisgenoot",
        titleEn: "Expenses stay linked to the right traveller",
        description:
          "Reisgenoten met dezelfde naam blijven apart in de verrekening en een naamswijziging verbreekt bestaande uitgaven niet.",
        descriptionEn:
          "Travellers with the same name remain separate in settlements, and renaming someone no longer disconnects existing expenses.",
      },
      {
        kind: "improved",
        title: "Vluchten rond vertrek beter gevonden",
        titleEn: "Better flight matching near departure",
        description:
          "Met een vertrekcode kan GlobeTrotr binnen het beschikbare datumvenster ook het luchthavenrooster controleren wanneer live vluchtstatus nog niets vindt.",
        descriptionEn:
          "With a departure code, GlobeTrotr can also check the airport schedule within the available date window when live flight status returns no result.",
      },
      {
        kind: "fixed",
        title: "Reisleden en paklijst zeker opgeslagen",
        titleEn: "Reliable traveller and packing list saves",
        description:
          "Wijzigingen aan reisleden en de paklijst wachten nu op bevestiging en herstellen automatisch wanneer opslaan mislukt.",
        descriptionEn:
          "Traveller and packing list changes now wait for confirmation and automatically recover when saving fails.",
      },
      {
        kind: "improved",
        title: "Een homepage die het product laat zien",
        titleEn: "A homepage that shows the product",
        description:
          "Een visuele reisdemo, duidelijke mogelijkheden, een kort stappenplan en openbare reisinspiratie maken de eerste kennismaking completer.",
        descriptionEn:
          "A visual trip demo, clear capabilities, a short walkthrough and public travel inspiration make the first visit more complete.",
      },
      {
        kind: "new",
        title: "Alle mogelijkheden bij elkaar",
        titleEn: "All features in one place",
        description:
          "Een nieuwe productpagina laat per reisfase zien hoe routes, planning, boekingen, kosten, samenwerking en delen werken.",
        descriptionEn:
          "A new product page shows how routes, planning, bookings, expenses, collaboration and sharing work at every trip stage.",
      },
      {
        kind: "new",
        title: "Zelf gegevens exporteren",
        titleEn: "Export your own data",
        description:
          "Accountinstellingen levert een machineleesbare kopie van account-, profiel-, reis- en samenwerkingsgegevens.",
        descriptionEn:
          "Account settings provides a machine-readable copy of account, profile, trip and collaboration data.",
      },
      {
        kind: "secure",
        title: "Account zelf verwijderen",
        titleEn: "Delete your own account",
        description:
          "Een extra bevestiging verwijdert het account, eigen reizen en bijbehorende uploads definitief uit de actieve dienst.",
        descriptionEn:
          "An additional confirmation permanently removes the account, owned trips and related uploads from the active service.",
      },
      {
        kind: "improved",
        title: "Uitgebreide beta- en privacy-informatie",
        titleEn: "Expanded beta and privacy information",
        description:
          "Testers krijgen een praktische testgids en een uitgebreidere AVG-privacyverklaring met doelen, rechten en bewaarinformatie.",
        descriptionEn:
          "Testers get a practical testing guide and a more complete GDPR privacy notice covering purposes, rights and retention.",
      },
    ],
  },
  {
    id: "2026-09-07-trip-collaboration",
    version: "Beta 0.7",
    publishedAt: "2026-09-07T23:51:00+02:00",
    title: "Samen plannen met duidelijke rollen",
    titleEn: "Plan together with clear roles",
    summary:
      "Bestaande accounts kunnen nu veilig aan één reis samenwerken met rechten die passen bij hun rol.",
    summaryEn:
      "Existing accounts can now collaborate safely on a single trip with permissions suited to their role.",
    changes: [
      {
        kind: "new",
        title: "Gedeelde reizen in je dashboard",
        titleEn: "Shared trips in your dashboard",
        description:
          "Een reis waarvoor je bent toegevoegd verschijnt na opnieuw inloggen herkenbaar als gedeelde reis.",
        descriptionEn:
          "A trip you have been added to appears as a shared trip after you sign in again.",
      },
      {
        kind: "secure",
        title: "Rechten per reisrol",
        titleEn: "Permissions per trip role",
        description:
          "Planning, uitgaven, alleen-lezen en eigenaarsacties zijn in de interface en op de server begrensd.",
        descriptionEn:
          "Planning, expenses, read-only access and owner actions are restricted in both the interface and server.",
      },
      {
        kind: "secure",
        title: "Financiële privacy",
        titleEn: "Financial privacy",
        description:
          "Kijkers en klanten ontvangen geen uitgaven; e-mailadressen van reisleden blijven voor niet-eigenaren verborgen.",
        descriptionEn:
          "Viewers and clients receive no expenses, while traveller email addresses remain hidden from non-owners.",
      },
    ],
  },
  {
    id: "2026-09-07-international-test-launch",
    version: "Beta 0.6",
    publishedAt: "2026-09-07T23:34:00+02:00",
    title: "De internationale test is geopend",
    titleEn: "The international test is open",
    summary:
      "De belangrijkste reisstromen zijn in de praktijk gecontroleerd en klaar voor de eerste testers.",
    summaryEn:
      "The essential travel flows have been tested in practice and are ready for the first testers.",
    changes: [
      {
        kind: "new",
        title: "Testopening",
        titleEn: "Test launch",
        description:
          "Reisplanning, boekingen, uitgaven, exports en openbaar delen zijn beschikbaar voor de eerste internationale testgroep.",
        descriptionEn:
          "Trip planning, bookings, expenses, exports and public sharing are available to the first international test group.",
      },
      {
        kind: "improved",
        title: "Gecontroleerd op mobiel",
        titleEn: "Verified on mobile",
        description:
          "De belangrijkste schermen en formulieren zijn op een echte telefoon gecontroleerd.",
        descriptionEn: "The main screens and forms have been verified on a real phone.",
      },
      {
        kind: "fixed",
        title: "Betrouwbare reisopslag",
        titleEn: "Reliable trip saving",
        description: "Wijzigingen aan reizen en uitgaven blijven na herladen correct bewaard.",
        descriptionEn: "Changes to trips and expenses remain correctly saved after reloading.",
      },
    ],
  },
  {
    id: "2026-09-07-international-beta-foundation",
    version: "Beta 0.5",
    publishedAt: "2026-09-07T19:30:00+02:00",
    title: "Klaar voor internationale testers",
    titleEn: "Ready for international testers",
    summary:
      "De eerste internationale beta-onderdelen zijn beschikbaar en belangrijke testinformatie is makkelijker te vinden.",
    summaryEn:
      "The first international beta features are available and essential testing information is easier to find.",
    changes: [
      {
        kind: "new",
        title: "Nederlands en Engels",
        titleEn: "Dutch and English",
        description:
          "Kies vanuit de header je taal voor de homepage, het inloggen en openbare reisverhalen.",
        descriptionEn:
          "Choose your language for the homepage, sign-in flow and public travel stories.",
      },
      {
        kind: "new",
        title: "Privacy en beta-voorwaarden",
        titleEn: "Privacy and beta terms",
        description:
          "De footer geeft rechtstreeks toegang tot heldere informatie over gegevens en verantwoord testen.",
        descriptionEn:
          "The footer links directly to clear information about data and responsible testing.",
      },
      {
        kind: "improved",
        title: "Rustigere formulieren",
        titleEn: "Clearer forms",
        description:
          "Belangrijke opslaanknoppen hebben meer ruimte en zijn daardoor duidelijker van de invoervelden gescheiden.",
        descriptionEn:
          "Important save buttons have more space and are easier to distinguish from the fields above.",
      },
      {
        kind: "improved",
        title: "Engelse exports en Agency-schermen",
        titleEn: "English exports and Agency screens",
        description:
          "CSV-bestanden, reisgidsen, declaraties en Agency-schermen volgen nu de taal van je account.",
        descriptionEn:
          "CSV files, trip guides, expense claims and Agency screens now follow your account language.",
      },
    ],
  },
  {
    id: "2026-09-07-public-trip-description",
    version: "Beta 0.4",
    publishedAt: "2026-09-07T18:50:00+02:00",
    title: "Meer verhaal, minder drukte",
    titleEn: "More story, less clutter",
    summary:
      "Gedeelde reizen krijgen ruimte voor een persoonlijke introductie en tonen lange routes compacter.",
    summaryEn:
      "Shared trips now have room for a personal introduction and present long routes more compactly.",
    changes: [
      {
        kind: "new",
        title: "Eigen reisomschrijving",
        titleEn: "Your own trip description",
        description:
          "Geef je reis een korte introductie die bovenaan de openbare reisweergave verschijnt.",
        descriptionEn: "Add a short introduction that appears at the top of the public trip page.",
      },
      {
        kind: "improved",
        title: "Rustigere openbare reis",
        titleEn: "Cleaner public trip",
        description:
          "De lange routezin is vervangen door de omschrijving of een korte samenvatting van bestemmingen en landen.",
        descriptionEn:
          "The long route line has been replaced by the description or a short destination and country summary.",
      },
      {
        kind: "improved",
        title: "Compacte bestemmingenlijst",
        titleEn: "Compact destination list",
        description:
          "Naast de kaart zie je eerst vier stops; de hele route blijft bereikbaar met één duidelijke knop.",
        descriptionEn:
          "The first four stops appear beside the map, with one clear button to reveal the full route.",
      },
    ],
  },
  {
    id: "2026-09-07-public-trips",
    version: "Beta 0.3",
    publishedAt: "2026-09-07T18:40:00+02:00",
    title: "Openbare reizen komen tot leven",
    titleEn: "Public trips come to life",
    summary:
      "Een gedeelde reis voelt nu als een echt reisverhaal, met route, planning en heldere details.",
    summaryEn:
      "A shared trip now feels like a real travel story, with its route, itinerary and clear details.",
    changes: [
      {
        kind: "new",
        title: "Interactieve routekaart",
        titleEn: "Interactive route map",
        description:
          "Bekijk de volledige route, selecteer een bestemming en volg de genummerde stops op de kaart.",
        descriptionEn:
          "View the full route, select a destination and follow the numbered stops on the map.",
      },
      {
        kind: "improved",
        title: "Dagplanning in overzichtelijke kaarten",
        titleEn: "Daily itinerary cards",
        description:
          "Activiteiten zijn per dag gegroepeerd in een rustige tijdlijn die ook op telefoon prettig leest.",
        descriptionEn:
          "Activities are grouped by day in a clear timeline that also reads well on mobile.",
      },
      {
        kind: "improved",
        title: "Een sterkere eerste indruk",
        titleEn: "A stronger first impression",
        description:
          "Reisnaam, periode, eigenaar en bestemmingen staan samen in een nieuwe visuele introductie.",
        descriptionEn:
          "The trip name, dates, owner and destinations are brought together in a new visual introduction.",
      },
      {
        kind: "secure",
        title: "Alleen gedeelde gegevens",
        titleEn: "Shared data only",
        description:
          "Privé-uitgaven, betalers, bonnetjes en boekingsdetails blijven buiten de openbare reisweergave.",
        descriptionEn:
          "Private expenses, payers, receipts and booking details remain outside the public trip page.",
      },
    ],
  },
  {
    id: "2026-09-07-reliable-saving",
    version: "Beta 0.2",
    publishedAt: "2026-09-07T17:30:00+02:00",
    title: "Betrouwbaarder opslaan en beter op mobiel",
    titleEn: "More reliable saving and better mobile support",
    summary:
      "Uitgaven en reiswijzigingen worden veiliger bewaard en formulieren passen beter op kleine schermen.",
    summaryEn:
      "Expenses and trip changes are saved more safely, and forms fit smaller screens better.",
    changes: [
      {
        kind: "fixed",
        title: "Uitgaven weer bijwerken",
        titleEn: "Edit expenses again",
        description:
          "Bestaande uitgaven kunnen weer worden aangepast en na herladen correct worden teruggelezen.",
        descriptionEn:
          "Existing expenses can be edited again and are restored correctly after reloading.",
      },
      {
        kind: "fixed",
        title: "Vluchtvelden binnen beeld",
        titleEn: "Flight fields stay in view",
        description: "Vertrek- en aankomsttijd vallen op telefoons niet meer buiten het formulier.",
        descriptionEn: "Departure and arrival times no longer overflow the form on mobile.",
      },
      {
        kind: "improved",
        title: "Uitgavenoverzicht op telefoon",
        titleEn: "Mobile expense overview",
        description:
          "Brede kostengegevens blijven bereikbaar via een nette horizontale weergave binnen het overzicht.",
        descriptionEn:
          "Wide expense details remain accessible through a contained horizontal view.",
      },
      {
        kind: "secure",
        title: "Bescherming tegen overschrijven",
        titleEn: "Protection against overwriting",
        description:
          "Bij wijzigingen vanuit twee tabbladen wordt een conflict gemeld voordat nieuwere gegevens verloren kunnen gaan.",
        descriptionEn:
          "Changes from two browser tabs now trigger a conflict before newer data can be lost.",
      },
    ],
  },
  {
    id: "2026-09-07-account",
    version: "Beta 0.1",
    publishedAt: "2026-09-07T16:30:00+02:00",
    title: "Meer inzicht in je account",
    titleEn: "More insight into your account",
    summary:
      "Je ziet nu direct welk plan actief is en hoeveel reizen binnen je account worden gebruikt.",
    summaryEn: "You can now see your active plan and trip usage directly in your account.",
    changes: [
      {
        kind: "new",
        title: "Plan en reisgebruik",
        titleEn: "Plan and trip usage",
        description:
          "Accountinstellingen tonen je plan, planlimiet en het aantal actieve en totale reizen.",
        descriptionEn:
          "Account settings show your plan, its trip limit, and your active and total trip counts.",
      },
      {
        kind: "improved",
        title: "Slimme abonnementsknop",
        titleEn: "Context-aware plan button",
        description:
          "Ga vanuit je account direct naar upgrades of naar het beheer van je huidige abonnement.",
        descriptionEn:
          "Go directly from your account to upgrades or management of your current plan.",
      },
      {
        kind: "fixed",
        title: "Juiste actie op gedeelde reizen",
        titleEn: "The right action on shared trips",
        description:
          "Ben je al ingelogd, dan ga je vanuit een openbare reis direct naar je eigen reizen.",
        descriptionEn: "When signed in, a public trip now takes you directly to your own trips.",
      },
    ],
  },
];
