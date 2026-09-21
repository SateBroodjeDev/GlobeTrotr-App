export const PUBLIC_TODAY = {
  date: ["21 september 2026", "21 September 2026"],
  title: ["Beta in gebruik, betrouwbaarheid verbeteren", "Beta in use, improving reliability"],
  description: [
    "Een eerste groep gebruikt GlobeTrotr. We onderzoeken meldingen over uitnodigingen, betalingen, agenda-export, bedrijfsmail en Agency-toegang.",
    "An initial group is using GlobeTrotr. We are investigating reports about invitations, payments, calendar exports, company mail and Agency access.",
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
    title: ["Internationale beta verbeteren", "Improve the international beta"],
    description: [
      "Feedback verwerken, bekende problemen oplossen en de ervaring op telefoon verder aanscherpen.",
      "Process feedback, resolve known issues and further refine the mobile experience.",
    ],
    items: [
      [
        "Betalingskoppeling, live agendalinks, uitnodigingen en Agency-klanttoegang in de actieve beta verifiëren",
        "Verify payment linking, live calendar feeds, invitations and Agency client access in the active beta",
      ],
      [
        "Paddle-betalingen tegen het juiste account, workspaceplan en toegangsrecht controleren",
        "Verify Paddle payments against the correct account, workspace plan and access rights",
      ],
      [
        "Nederlandse en Engelse servicemails en meldingen zonder technische codes controleren",
        "Verify Dutch and English service emails and notifications without technical codes",
      ],
      [
        "Publieke reisschema's, mailtaal en mobiele uitgavenformulieren met testers nalopen",
        "Review public itineraries, email language and mobile expense forms with testers",
      ],
      [
        "Bedrijfsmailgesprekken, bijlagen, opmaak en beveiligde verwerking in de beta controleren",
        "Verify company-mail conversations, attachments, formatting and secure processing in the beta",
      ],
      [
        "Postvakstatus en herstel na een mislukte synchronisatie met testers controleren",
        "Verify mailbox status and recovery after a failed synchronisation with testers",
      ],
      [
        "Agency-downgrade en terugkeer naar GlobeTrotr praktisch controleren",
        "Practically verify Agency downgrade and return to GlobeTrotr",
      ],
      [
        "De vernieuwde homepage en productrondleiding op telefoon en desktop controleren",
        "Review the renewed homepage and product tour on mobile and desktop",
      ],
      [
        "Actuele beta-beperkingen transparant opvolgen",
        "Transparently track current beta limitations",
      ],
      [
        "Betrouwbaarheid en privacy blijven controleren",
        "Continue checking reliability and privacy",
      ],
    ],
  },
  {
    status: "next",
    title: ["Samenwerking en communicatie", "Collaboration and communication"],
    description: [
      "Uitnodigingen en updates eenvoudiger bij alle reizigers krijgen.",
      "Make invitations and updates easier to reach every traveller.",
    ],
    items: [
      [
        "Zelf gehoste EU-vertaling voor feedback, meldingen, onderhoud, recensies en mail met menselijke controle testen",
        "Test self-hosted EU translation for feedback, notices, maintenance, testimonials and mail with human review",
      ],
      [
        "HTML-handtekeningen met logo en tekstfallback in gangbare mailapps controleren",
        "Verify HTML signatures with logo and text fallback in common email apps",
      ],
      [
        "Tijdelijk mislukte bedrijfsmail met behoud van opmaak en bijlagen opnieuw bezorgen",
        "Retry temporarily failed company email while preserving formatting and attachments",
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
