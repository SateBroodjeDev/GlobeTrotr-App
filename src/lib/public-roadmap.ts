export const PUBLIC_TODAY = {
  date: ["24 september 2026", "24 September 2026"],
  title: ["Dagelijks werken aan release 1.0", "Working towards release 1.0 every day"],
  description: [
    "De beta loopt van 0.1 tot en met 0.9. We gebruiken deze laatste week voor praktijktests, herstel van bekende problemen en een gecontroleerde productie-uitrol. Release 1.0 staat gepland voor 1 oktober en gaat alleen door wanneer de vrijgavecontrole slaagt.",
    "The beta runs from 0.1 through 0.9. We are using this final week for practical tests, resolving known issues and a controlled production rollout. Release 1.0 is planned for 1 October and will only proceed when release checks pass.",
  ],
  completed: [
    ["Reisplanning, samenwerking, boekingen, uitgaven en delen", "Trip planning, collaboration, bookings, expenses and sharing"],
    ["Paddle-betalingen, facturen en abonnementsrechten", "Paddle payments, invoices and subscription entitlements"],
    ["Agency- en Corporate Admin, klantportaal en governance", "Agency and Corporate Admin, client portal and governance"],
    ["Veilige exports, GPX, live agenda en begrensd offline gebruik", "Safe exports, GPX, live calendar and bounded offline use"],
  ],
} as const;

export const PUBLIC_ROADMAP = [
  { status: "now", title: ["Deze week", "This week"], description: ["Release 1.0 bewijzen op echte productiegegevens en apparaten.", "Prove release 1.0 with real production data and devices."], items: [
    ["Reisvergelijker, reacties en peilingen na herladen controleren", "Verify Trip Comparison, comments and polls after reloading"],
    ["Live agenda, offline dagoverzicht en mobiele reisbediening testen", "Test live calendars, the offline daily view and mobile trip controls"],
    ["Agency-subdomeinen en geverifieerde eigen domeinen per organisatie controleren", "Verify Agency subdomains and verified custom domains for each organisation"],
    ["Pushmeldingen configureren en end-to-end ontvangen", "Configure and receive push notifications end to end"],
    ["Registratie, betalingen, privacy en ZXCS-mail opnieuw accepteren", "Re-verify registration, payments, privacy and ZXCS email"],
    ["Reisdatums met impactpreview en verbeterd bedrijfsmailbeheer testen", "Test trip date shifting with an impact preview and improved company mail management"],
  ] },
  { status: "next", title: ["Na 1.0", "After 1.0"], description: ["Kleine uitbreidingen die voortbouwen op bestaande reisgegevens.", "Small extensions that build on existing trip data."], items: [
    ["Reisvarianten, favoriete plaatsen en algemene checklijsten", "Trip variants, favourite places and general checklists"],
    ["Praktische plaatsen rond een reisstop en check-inherinneringen", "Practical places near a trip stop and check-in reminders"],
    ["Een officiële hotelprovider voor live prijzen en beschikbaarheid selecteren", "Select an official hotel provider for live prices and availability"],
  ] },
  { status: "later", title: ["Later", "Later"], description: ["Uitbreidingen die providers, extra privacywerk of operationeel beheer vragen.", "Extensions that require providers, additional privacy work or operational support."], items: [
    ["Prijsalerts, vlucht-, autohuur- en activiteitenzoekfuncties", "Price alerts and flight, car rental and activity search"],
    ["Routeoptimalisatie met handmatige bevestiging", "Route optimisation with manual confirmation"],
    ["Geselecteerde documenten veilig offline beschikbaar maken", "Make selected documents safely available offline"],
    ["Eigen mailserver pas na poortvrijgave en volledige aflever- en herstelproef", "Self-hosted email only after port access and complete delivery and recovery trials"],
  ] },
] as const;
