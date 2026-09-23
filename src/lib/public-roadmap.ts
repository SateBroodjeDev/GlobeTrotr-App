export const PUBLIC_TODAY = {
  date: ["23 september 2026", "23 September 2026"],
  title: ["Beta in gebruik, publieke opening voorbereiden", "Beta in use, preparing public launch"],
  description: [
    "Een eerste groep gebruikt GlobeTrotr. We controleren update 1.2 met GPX-import en ontbrekende-hotelcontrole, bereiden de eigen mailserver voor en onderzoeken een officiële hotel-API voor live zoeken en vergelijken. Tot Hetzner uitgaande mail vrijgeeft, blijven gewone en bedrijfsmail veilig via ZXCS lopen.",
    "An initial group is using GlobeTrotr. We are verifying update 1.2 with GPX import and missing-hotel checks, preparing the self-hosted mail server and evaluating an official hotel API for live search and comparison. Regular and company email remain safely on ZXCS until Hetzner enables outbound mail.",
  ],
  completed: [
    [
      "Reizen plannen met routes, boekingen, taken, documenten en dagoverzicht",
      "Plan trips with routes, bookings, tasks, documents and a daily overview",
    ],
    [
      "Uitgaven bijhouden, verdelen en analyseren met budgetprognoses",
      "Track, split and analyse expenses with budget forecasts",
    ],
    [
      "Reizen veilig delen met reisgenoten, klanten en openbare bezoekers",
      "Securely share trips with travellers, clients and public visitors",
    ],
    [
      "Losse agenda-, GPX-, PDF-, JSON- en CSV-export voor gebruik buiten GlobeTrotr",
      "One-time calendar, GPX, PDF, JSON and CSV exports for use outside GlobeTrotr",
    ],
    [
      "Agency-beheer voor klanten, offertes, leveranciers, taken en huisstijl",
      "Agency management for clients, quotes, suppliers, tasks and branding",
    ],
    [
      "Paddle-checkout voor Pro en Agency, maandelijks of voor één losse maand",
      "Paddle checkout for Pro and Agency, monthly or for one standalone month",
    ],
    [
      "Persoonlijke en gedeelde bedrijfspostvakken voor teamcommunicatie",
      "Personal and shared company mailboxes for team communication",
    ],
    [
      "Google, Discord, passkeys en TOTP voor veilige accounttoegang",
      "Google, Discord, passkeys and TOTP for secure account access",
    ],
    [
      "Privacyverzoeken, meldingsvoorkeuren en Europese gegevensopslag",
      "Privacy requests, notification preferences and European data storage",
    ],
    [
      "Corporate Admin voor status, feedback, incidenten, audits en releasecontroles",
      "Corporate Admin for status, feedback, incidents, audits and release checks",
    ],
  ],
} as const;

export const PUBLIC_ROADMAP = [
  {
    status: "now",
    title: ["Publieke opening voorbereiden", "Prepare the public launch"],
    description: [
      "De belangrijkste klantstromen met echte accounts en apparaten bevestigen en gevonden fouten oplossen.",
      "Confirm the main customer journeys with real accounts and devices, then resolve any findings.",
    ],
    items: [
      [
        "Navigatie, aanraakvlakken en belangrijke pagina's tussen de publieke website en het accountportaal op telefoon en desktop bevestigen",
        "Verify navigation, touch targets and key pages across the public website and account portal on mobile and desktop",
      ],
      [
        "Agency-subdomeinen en eigen domeinen met DNS, HTTPS en klanttoegang controleren",
        "Verify Agency subdomains and custom domains with DNS, HTTPS and client access",
      ],
      [
        "Registratie, uitnodigingen, betalingen en live agendalinks met echte accounts bevestigen",
        "Confirm sign-up, invitations, payments and live calendar feeds with real accounts",
      ],
      [
        "De Reisvergelijker, reacties en peilingen met echte reisleden, valuta en mobiele schermen bevestigen",
        "Verify Trip comparison, comments and polls with real trip members, currencies and mobile screens",
      ],
      [
        "Nederlandse en Engelse servicemails en meldingen zonder technische codes controleren",
        "Verify Dutch and English service emails and notifications without technical codes",
      ],
      [
        "Homepage, demo, reispagina's, privacy en mobiel gebruik in beide talen nalopen",
        "Review home, demo, trip pages, privacy and mobile use in both languages",
      ],
      [
        "Bedrijfsmailgesprekken, bijlagen, opmaak en beveiligde verwerking in de beta controleren",
        "Verify company-mail conversations, attachments, formatting and secure processing in the beta",
      ],
      [
        "De eigen mailserver, automatische reisadressen en mailauthenticatie voorbereiden; de omschakeling wacht op vrijgave van uitgaand mailverkeer door de VPS-provider",
        "Prepare the self-hosted mail server, automated trip addresses and email authentication; cutover is waiting for the VPS provider to enable outbound email",
      ],
      [
        "Boekingsmailconcepten met echte hotel- en vluchtbevestigingen controleren voordat ze als boeking worden opgeslagen",
        "Verify booking email drafts with real hotel and flight confirmations before they are saved as bookings",
      ],
      [
        "De Agency-contentbibliotheek met rollen, talen, versies, bronnen, licenties en gecontroleerde toepassing op reis of offerte in productie controleren",
        "Verify the Agency content library with roles, languages, versions, sources, licences and controlled application to a trip or quote in production",
      ],
      [
        "Het expliciet opgeslagen offline dagoverzicht zonder netwerk en na uitloggen op echte telefoons controleren",
        "Verify the explicitly saved offline day view without a network and after sign-out on real phones",
      ],
      [
        "GPX-routes veilig importeren met preview, selectie en herkenning van bestaande routepunten",
        "Safely import GPX routes with preview, selection and detection of existing route points",
      ],
      [
        "Optionele webpush per apparaat met veilige algemene inhoud in productie controleren",
        "Verify optional per-device web push with safe generic content in production",
      ],
    ],
  },
  {
    status: "next",
    title: ["Samenwerking verfijnen", "Refine collaboration"],
    description: [
      "Dagelijkse samenwerking voor reizigers en reisorganisaties eenvoudiger maken.",
      "Make everyday collaboration easier for travellers and travel organisations.",
    ],
    items: [
      [
        "Een officiële hotelprovider selecteren voor live zoeken, transparante totaalprijzen, vergelijken en veilig doorsturen om te boeken",
        "Select an official hotel provider for live search, transparent total prices, comparison and safe hand-off to booking",
      ],
      [
        "Het zoekmodel voorbereiden voor latere uitbreiding naar vluchten, autohuur en activiteiten zonder de reisplanner aan één provider vast te zetten",
        "Prepare the search model for later expansion to flights, car rental and activities without locking the trip planner to one provider",
      ],
      [
        "Samen stemmen over kandidaten met een deadline en een gecontroleerde definitieve keuze",
        "Vote together on candidates with a deadline and a controlled final choice",
      ],
      [
        "Uitnodigingen en rolwissels voor grotere groepen vereenvoudigen",
        "Simplify invitations and role changes for larger groups",
      ],
      [
        "Agency-klantportaal verder laten aansluiten op eigen huisstijl en domein",
        "Bring the Agency client portal closer to each organisation's brand and domain",
      ],
      [
        "Veilige klantformulieren accepteren en Agency-sjablonen uitbreiden met rijke herbruikbare inhoud",
        "Verify secure client forms and expand Agency templates with rich reusable content",
      ],
      [
        "Bedrijfsmailgesprekken en samenwerken aan antwoorden overzichtelijker maken",
        "Make company-mail conversations and shared replies easier to manage",
      ],
      [
        "Na de mailserverproef automatische reisadressen gecontroleerd activeren en boekingsconcepten met echte aanbieders accepteren",
        "After the mail-server trial, safely enable automatic trip addresses and verify booking drafts with real providers",
      ],
      [
        "Vertaalconcepten sneller beoordelen voordat ze zichtbaar worden",
        "Make translation drafts faster to review before they are published",
      ],
    ],
  },
  {
    status: "later",
    title: ["Slimmere reisassistentie", "Smarter travel assistance"],
    description: [
      "Meer handwerk wegnemen zonder controle over je reis over te nemen.",
      "Remove more manual work while keeping you in control of your trip.",
    ],
    items: [
      [
        "Offline gebruik later uitbreiden met geselecteerde documenten en gecontroleerde conflictafhandeling",
        "Later expand offline use with selected documents and controlled conflict resolution",
      ],
      [
        "Optioneel reisdagboek met foto's en expliciete zichtbaarheid",
        "Optional trip journal with photos and explicit visibility",
      ],
      [
        "Routevolgorde met handmatige bevestiging optimaliseren",
        "Optimise route order with manual confirmation",
      ],
      [
        "Vluchtcontrole na de productieproef uitbreiden met meer providers en persoonlijke regels",
        "After production verification, expand flight monitoring with more providers and personal rules",
      ],
      [
        "Live aanbod voor verblijven, vervoer en activiteiten via goedgekeurde providers zoeken",
        "Search live accommodation, transport and activity inventory through approved providers",
      ],
      [
        "Prijsalerts en flexibele data voor bewaarde reisopties onderzoeken",
        "Explore price alerts and flexible dates for saved travel options",
      ],
      [
        "Plaatsen, activiteiten en openingstijden rond een stop ontdekken met duidelijke bronvermelding",
        "Discover places, activities and opening hours near a stop with clear source attribution",
      ],
      [
        "Uitgebreidere Agency-werkstromen met meerdere acties",
        "Expanded Agency workflows with multiple actions",
      ],
    ],
  },
] as const;
