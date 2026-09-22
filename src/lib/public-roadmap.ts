export const PUBLIC_TODAY = {
  date: ["22 september 2026", "22 September 2026"],
  title: ["Beta in gebruik, publieke opening voorbereiden", "Beta in use, preparing public launch"],
  description: [
    "Een eerste groep gebruikt GlobeTrotr. Voor de publieke opening controleren we de complete reis, betaling, mail en Agency-domeinen opnieuw in productie.",
    "An initial group is using GlobeTrotr. Before the public launch, we are rechecking the complete trip, payment, mail and Agency domain flows in production.",
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
        "Agency-subdomeinen en eigen domeinen met DNS, HTTPS en klanttoegang controleren",
        "Verify Agency subdomains and custom domains with DNS, HTTPS and client access",
      ],
      [
        "Registratie, uitnodigingen, betalingen en live agendalinks met echte accounts bevestigen",
        "Confirm sign-up, invitations, payments and live calendar feeds with real accounts",
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
        "Uitnodigingen en rolwissels voor grotere groepen vereenvoudigen",
        "Simplify invitations and role changes for larger groups",
      ],
      [
        "Agency-klantportaal verder laten aansluiten op eigen huisstijl en domein",
        "Bring the Agency client portal closer to each organisation's brand and domain",
      ],
      [
        "Bedrijfsmailgesprekken en samenwerken aan antwoorden overzichtelijker maken",
        "Make company-mail conversations and shared replies easier to manage",
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
      ["Boekingsbevestigingen omzetten naar concepten", "Turn booking confirmations into drafts"],
      ["Offline reisoverzicht vooraf downloaden", "Download an offline trip overview in advance"],
      ["Optioneel reisdagboek met foto's en expliciete zichtbaarheid", "Optional trip journal with photos and explicit visibility"],
      [
        "Routevolgorde met handmatige bevestiging optimaliseren",
        "Optimise route order with manual confirmation",
      ],
      ["Periodieke vluchtupdates", "Periodic flight updates"],
      [
        "Uitgebreidere Agency-werkstromen met meerdere acties",
        "Expanded Agency workflows with multiple actions",
      ],
    ],
  },
] as const;
