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
  ],
  tests: [
    ["Nodig één bestaand account uit en controleer dat weigeren ook de regel Uitgenodigd verwijdert", "Invite one existing account and check that declining also removes its Invited row"],
    ["Controleer dat acceptatie één reisgenoot toont en dat verwijderen op beide accounts doorwerkt", "Check that acceptance shows one traveller and removal is reflected for both accounts"],
    ["Wijzig een gedeelde reis meerdere keren en controleer dat één melding overblijft", "Change a shared trip several times and check that one notification remains"],
    ["Wijzig een feedbackstatus en publiceer één testbericht vanuit Corporate Admin", "Change a feedback status and publish one test message from Corporate Admin"],
    ["Controleer live weer en voer daarna de platformstatuscontrole uit", "Check live weather and then run the platform status check"],
    ["Exporteer een back-up, importeer hem en controleer dat een nieuwe privéreis ontstaat", "Export a backup, import it and check that a new private trip is created"],
    ["Open de auditlog en controleer naam, e-mailadres, actie, resultaat en tijd", "Open the audit log and check name, email, action, result and time"],
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
