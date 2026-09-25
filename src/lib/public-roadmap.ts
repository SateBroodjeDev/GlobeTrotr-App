export const PUBLIC_TODAY = {
  date: ["25 september 2026", "25 September 2026"],
  title: ["Beta 0.9.1 gereedmaken voor release 1.0", "Preparing Beta 0.9.1 for release 1.0"],
  description: [
    "Beta 0.9.1 bundelt de laatste productronde voor route-import, samenwerken, offline gebruik, verblijfcontrole, reisdagboek en routeverbetering. De functies zijn gebouwd; deze laatste week gebruiken we voor een gecontroleerde productie-uitrol en praktijktests. Release 1.0 staat gepland voor 1 oktober en gaat alleen door wanneer de vrijgavecontrole slaagt.",
    "Beta 0.9.1 bundles the final product round for route imports, collaboration, offline use, accommodation checks, the travel journal and route improvements. The features are built; we are using this final week for a controlled production rollout and practical testing. Release 1.0 is planned for 1 October and will only proceed when release checks pass.",
  ],
  completed: [
    ["Reisplanning, samenwerking, boekingen, uitgaven en delen", "Trip planning, collaboration, bookings, expenses and sharing"],
    ["Reisdagboek met afgeschermde foto's en bewuste publieke reisterugblik", "Travel journal with protected photos and an intentional public travel story"],
    ["Routevoorstel, GPX-preview, plaatsen langs de route en verblijfvergelijking", "Route proposals, GPX previews, places along the route and accommodation comparison"],
    ["Paddle, veilige exports, live agenda, meldingen en begrensd offline gebruik", "Paddle, safe exports, live calendars, notifications and bounded offline use"],
  ],
} as const;

export const PUBLIC_ROADMAP = [
  {
    status: "now",
    title: ["Nu: productieacceptatie", "Now: production acceptance"],
    description: ["De gebouwde 0.9.1-functies bewijzen met echte reizen, apparaten en rollen.", "Prove the completed 0.9.1 features with real trips, devices and roles."],
    items: [
      ["Reisdagboek testen: fotobeheer, offline tekstconcept, zichtbaarheid en openbare reisterugblik", "Test the travel journal: photo management, offline text drafts, visibility and the public travel story"],
      ["Routevoorstel, GPX-preview, plaatsen rond de route en verblijfcontrole praktisch controleren", "Practically verify route proposals, GPX previews, places near the route and accommodation checks"],
      ["Groepsuitnodigingen, gedeelde lijsten, Reisvergelijker en veilige reisvarianten controleren", "Verify group invitations, shared lists, Trip Comparison and safe trip variants"],
      ["Mobiel, offline uitgaven, live agenda, registratie, betaling, privacy, push en ZXCS-mail accepteren", "Accept mobile use, offline expenses, live calendars, registration, payments, privacy, push and ZXCS email"],
    ],
  },
  {
    status: "next",
    title: ["Na 1.0", "After 1.0"],
    description: ["Uitbreidingen die aansluiten op de nu beschikbare reisgegevens.", "Extensions that build on the travel data now available."],
    items: [
      ["Een officiële hotelprovider selecteren voor live prijzen en beschikbaarheid", "Select an official hotel provider for live prices and availability"],
      ["Routevoorstellen uitbreiden met echte wegafstanden en verkeer via een routeprovider", "Extend route proposals with real road distances and traffic through a routing provider"],
      ["Geselecteerde documenten en dagboekfoto's veilig offline beschikbaar maken", "Make selected documents and journal photos safely available offline"],
      ["Prijsalerts en zoekfuncties voor vlucht, autohuur en activiteiten onderzoeken", "Explore price alerts and search for flights, rental cars and activities"],
    ],
  },
  {
    status: "later",
    title: ["Later", "Later"],
    description: ["Werk dat extra infrastructuur, providers of een afzonderlijke acceptatieronde vraagt.", "Work that requires additional infrastructure, providers or a separate acceptance round."],
    items: [
      ["Agency-domeinen, white-label branding en eigen SMTP afzonderlijk accepteren", "Accept Agency domains, white-label branding and custom SMTP separately"],
      ["Objectopslag via een verwisselbare opslaglaag inschakelen wanneer capaciteit dat nodig maakt", "Enable object storage through a replaceable storage layer when capacity requires it"],
      ["De eigen mailserver pas vrijgeven na poortvrijgave en volledige aflever- en herstelproef", "Release the self-hosted mail server only after port access and complete delivery and recovery trials"],
    ],
  },
] as const;
