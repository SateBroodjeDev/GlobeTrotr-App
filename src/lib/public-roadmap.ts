export const PUBLIC_TODAY = {
  date: ["9 september 2026", "9 September 2026"],
  title: ["Samenwerken, meldingen en herstel", "Collaboration, notifications and recovery"],
  description: [
    "Een grote betastap staat klaar: uitnodigingen zijn eenduidiger, meldingen houden iedereen gericht op de hoogte en reisback-ups kunnen veilig worden teruggezet.",
    "A major beta step is ready: invitations are clearer, notifications keep everyone informed and trip backups can be restored safely.",
  ],
  completed: [
    ["Reisuitnodigingen accepteren of weigeren zonder dubbele reisgenoten", "Accept or decline trip invitations without duplicate travellers"],
    ["Reisgenoten definitief verwijderen en open uitnodigingen intrekken", "Remove travellers completely and revoke pending invitations"],
    ["Terugkoppeling aan de uitnodiger en melding aan een verwijderd reisgenoot", "Notify the inviter and a traveller who has been removed"],
    ["Reiswijzigingen samenvoegen tot één actuele melding per reis", "Combine trip changes into one current notification per trip"],
    ["Meldingen over feedbackstatus, platformstatus en belangrijke updates", "Notifications about feedback, platform status and important updates"],
    ["Betrouwbaarder live weer via een beveiligde serververbinding met tweede weerbron", "More reliable live weather through a secured server connection with a second provider"],
    ["JSON-reisback-ups veilig importeren als nieuwe privéreizen", "Safely import JSON trip backups as new private trips"],
    ["Een herkenbare Corporate Admin-auditlog met de uitvoerende beheerder", "A recognisable Corporate Admin audit log showing the acting administrator"],
    ["Actuele platformstatus als wegklikbare banner met opvolging en oplossing", "Current platform status as a dismissible banner with updates and resolution"],
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
        "Beveiligde uitnodigingslinks, antwoorden en terugkoppeling aan de uitnodiger",
        "Secure invitation links, responses and updates for the inviter",
      ],
      ["Betere feedback- en probleemopvolging", "Better feedback and issue follow-up"],
      [
        "Corporate Admin-dashboard voor veilig platformbeheer",
        "Corporate Admin dashboard for secure platform management",
      ],
      [
        "Betrouwbaarheid en privacy blijven controleren",
        "Continue checking reliability and privacy",
      ],
      [
        "Reisplanning en openbare reispagina's verfijnen",
        "Refine trip planning and public trip pages",
      ],
      ["Live weer met twee providers in productie volgen", "Monitor live weather with two providers in production"],
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
        "Automatische reisuitnodigingen en updates via e-mail",
        "Automated trip invitations and updates by email",
      ],
      [
        "Uitnodigingen intrekken, vernieuwen en overzichtelijk beheren",
        "Revoke, renew and clearly manage invitations",
      ],
      ["Veilige automatische vertaling van feedback", "Safe automatic feedback translation"],
      ["Meer meldingsvoorkeuren", "More notification preferences"],
      ["Afzonderlijk beheer van open reisuitnodigingen", "Dedicated management of pending trip invitations"],
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
      ["Periodieke vluchtupdates", "Periodic flight updates"],
      [
        "Agencybreed samenwerken met gedeelde reizen en herkenbare branding",
        "Agency-wide collaboration with shared trips and recognisable branding",
      ],
      ["Agency-logo en optionele branding per reis", "Agency logo and optional branding per trip"],
    ],
  },
] as const;
