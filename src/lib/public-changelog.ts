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
  label: "Internationale beta",
  labelEn: "International beta",
  description:
    "GlobeTrotr wordt met een beperkte groep reizigers en reisorganisaties getest. Alleen praktisch bevestigde en uitgerolde verbeteringen verschijnen hieronder; werk in verificatie staat op de roadmap.",
  descriptionEn:
    "GlobeTrotr is being tested with a limited group of travellers and travel organisations. Only practically confirmed and deployed improvements appear below; work under verification is listed on the roadmap.",
  unavailable: [
    {
      nl: "Eigen Agency-domeinen zonder CNAME- en TXT-instelling bij je domeinprovider",
      en: "Custom Agency domains without CNAME and TXT setup at your domain provider",
    },
  ],
} as const;

/** Zichtbaar werk in ontwikkeling; verschijnt bewust niet als gepubliceerde release. */
export const PUBLIC_IN_PROGRESS = {
  title: "Wat we nu afronden",
  titleEn: "What we're finalising",
  description:
    "Update 1.1 is uitgerold. We ronden nu de productieacceptatie af. De overstap van ZXCS naar de eigen mailserver blijft een afzonderlijke, gecontroleerde migratie en gebeurt pas na aflever-, back-up- en hersteltests.",
  descriptionEn:
    "Update 1.1 has been deployed and is now completing production acceptance. Moving from ZXCS to the self-hosted mail server remains a separate controlled migration and will only follow delivery, backup and recovery tests.",
} as const;

/** Public-safe, grouped release notes. Unreleased or unverified fixes stay out of this list. */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    id: "2026-09-23-update-1-1",
    version: "Update 1.1",
    publishedAt: "2026-09-23T12:00:00+02:00",
    title: "Samen beslissen en voorbereid op reis",
    titleEn: "Decide together and travel prepared",
    summary:
      "Een grote productupdate voor vergelijken, samenwerken, Agency-intake, meldingen en gebruik onderweg.",
    summaryEn:
      "A major product update for comparison, collaboration, Agency intake, notifications and use while travelling.",
    changes: [
      {
        kind: "new",
        title: "Reisvergelijker en gezamenlijke keuzes",
        titleEn: "Trip comparison and shared decisions",
        description:
          "Vergelijk reisopties per categorie, bespreek kandidaten, stem samen en zet de definitieve keuze gecontroleerd om naar één boeking.",
        descriptionEn:
          "Compare travel options by category, discuss candidates, vote together and convert the final choice into exactly one booking.",
      },
      {
        kind: "new",
        title: "Veilige klantformulieren voor Agencies",
        titleEn: "Secure Agency client forms",
        description:
          "Agencies kunnen tweetalige intakeformulieren delen, antwoorden beoordelen en goedgekeurde voorkeuren verwerken zonder gevoelige geheimvelden te verzamelen.",
        descriptionEn:
          "Agencies can share bilingual intake forms, review responses and process approved preferences without requesting confidential account details.",
      },
      {
        kind: "new",
        title: "Offline dagoverzicht en uitgaven",
        titleEn: "Offline daily view and expenses",
        description:
          "Bewaar bewust een beperkt reispakket voor onderweg, bekijk dagen zonder verbinding en synchroniseer nieuwe uitgaven na herstel van internet.",
        descriptionEn:
          "Explicitly save a limited trip pack for the road, view travel days without a connection and synchronise new expenses once internet access returns.",
      },
      {
        kind: "improved",
        title: "Meldingen en vluchtcontrole",
        titleEn: "Notifications and flight monitoring",
        description:
          "Optionele webpush en begrensde vluchtcontrole melden relevante wijzigingen zonder reisdetails in de pushmelding te tonen.",
        descriptionEn:
          "Optional web push and bounded flight monitoring report relevant changes without exposing trip details in the push notification.",
      },
      {
        kind: "new",
        title: "Agency-contentbibliotheek",
        titleEn: "Agency content library",
        description:
          "Beheer herbruikbare, tweetalige reiscontent met rollen, versies en broninformatie en voeg die gecontroleerd toe aan reizen en offertes.",
        descriptionEn:
          "Manage reusable bilingual travel content with roles, versions and source information, then apply it to trips and quotes in a controlled way.",
      },
      {
        kind: "improved",
        title: "Boekingsmail met menselijke controle",
        titleEn: "Booking email with human review",
        description:
          "Doorgestuurde boekingsmail wordt als controleerbaar concept herkend; wijzigingen, annuleringen en dubbelen worden gemarkeerd voordat iets in de reis komt.",
        descriptionEn:
          "Forwarded booking email is recognised as a reviewable draft; changes, cancellations and duplicates are flagged before anything enters the trip.",
      },
    ],
  },
  {
    id: "2026-09-21-communication-reliability",
    version: "Beta 0.19",
    publishedAt: "2026-09-21T20:30:00+02:00",
    title: "Betrouwbare communicatie en betalingen",
    titleEn: "Reliable communication and payments",
    summary:
      "De nieuwste verbeteringen voor mail, vertaling, betalingen en agenda zijn in productie bevestigd.",
    summaryEn:
      "The latest improvements to mail, translation, payments and calendars are confirmed in production.",
    changes: [
      {
        kind: "improved",
        title: "Professionele bedrijfsmail",
        titleEn: "Professional company email",
        description:
          "Bedrijfsmail gebruikt veilige HTML, een herkenbare handtekening en behoudt opmaak en bijlagen bij opnieuw bezorgen.",
        descriptionEn:
          "Company email uses safe HTML, a recognisable signature and preserves formatting and attachments when retried.",
      },
      {
        kind: "new",
        title: "Vertaalconcepten met controle",
        titleEn: "Translation drafts with review",
        description:
          "Feedback, meldingen, onderhoud, recensies en bedrijfsmail kunnen tussen Nederlands en Engels als controleerbaar concept worden vertaald.",
        descriptionEn:
          "Feedback, notices, maintenance, testimonials and company email can be translated between Dutch and English as reviewable drafts.",
      },
      {
        kind: "fixed",
        title: "Betaling en live agenda hersteld",
        titleEn: "Payments and live calendars restored",
        description:
          "Betaalrechten, gelokaliseerde betaalmeldingen en live agenda-abonnementen zijn na de productie-uitrol gecontroleerd.",
        descriptionEn:
          "Payment entitlements, localised payment notices and live calendar subscriptions were verified after the production rollout.",
      },
    ],
  },
  {
    id: "2026-09-21-trip-polish",
    version: "Beta 0.18",
    publishedAt: "2026-09-21T12:00:00+02:00",
    title: "Reizen delen en exporteren",
    titleEn: "Share and export trips",
    summary: "Verbeteringen die in de actieve beta zijn bevestigd.",
    summaryEn: "Improvements confirmed in the active beta.",
    changes: [
      {
        kind: "improved",
        title: "Overzichtelijke openbare reispagina",
        titleEn: "Clearer public trip page",
        description: "De gedeelde reis toont de planning leesbaarder.",
        descriptionEn: "Shared trips present the itinerary more clearly.",
      },
      {
        kind: "fixed",
        title: "GPX en losse agenda-export",
        titleEn: "GPX and one-time calendar export",
        description:
          "GPX-download en losse ICS-export werkten vanaf deze beta; de live abonnementlink was in deze release nog in onderzoek.",
        descriptionEn:
          "GPX download and one-time ICS export worked from this beta; the live subscription link was still under investigation in this release.",
      },
      {
        kind: "fixed",
        title: "Uitgaven en bedrijfsbeheer",
        titleEn: "Expenses and corporate management",
        description:
          "De tekst bij 'betaald door' past weer in de knop en bedrijfsbeheerderaccounts kunnen worden opgeslagen.",
        descriptionEn:
          "The paid-by label fits its button and corporate administrator accounts can be saved.",
      },
    ],
  },
  {
    id: "2026-09-15-payments-calendar",
    version: "Beta 0.17",
    publishedAt: "2026-09-15T16:00:00+02:00",
    title: "Betalen en agenda",
    titleEn: "Payments and calendar",
    summary:
      "Paddle-checkout, facturen en agenda-export zijn samengebracht in één duidelijke productupdate.",
    summaryEn:
      "Paddle checkout, invoices and calendar export are combined in one clear product update.",
    changes: [
      {
        kind: "new",
        title: "Maandelijks of één losse maand",
        titleEn: "Monthly or one-time month",
        description:
          "Pro en Agency ondersteunen een doorlopend abonnement en een losse maand zonder automatische verlenging.",
        descriptionEn:
          "Pro and Agency support a recurring subscription and a one-time month without automatic renewal.",
      },
      {
        kind: "new",
        title: "Facturen en abonnement beheren",
        titleEn: "Manage invoices and subscriptions",
        description:
          "Betalingen lopen via Paddle en het klantportaal geeft toegang tot facturen, betaalmethode en opzegging.",
        descriptionEn:
          "Payments use Paddle and the customer portal provides invoices, payment methods and cancellation.",
      },
      {
        kind: "improved",
        title: "Agenda exporteren",
        titleEn: "Export your calendar",
        description:
          "Een reisplanning kan als los ICS-bestand worden gebruikt; live agenda-abonnementen worden tijdens de beta verder getest.",
        descriptionEn:
          "A trip schedule can be used as an ICS file; live calendar subscriptions continue to be tested during beta.",
      },
    ],
  },
  {
    id: "2026-09-14-access-communication",
    version: "Beta 0.16",
    publishedAt: "2026-09-14T23:55:00+02:00",
    title: "Toegang en communicatie",
    titleEn: "Access and communication",
    summary:
      "Accountbeveiliging, servicemail, privacyverzoeken en bedrijfsmail kregen één samenhangende basis.",
    summaryEn:
      "Account security, service email, privacy requests and company email received one coherent foundation.",
    changes: [
      {
        kind: "secure",
        title: "Meer veilige inlogmethoden",
        titleEn: "More secure sign-in methods",
        description:
          "Naast e-mail ondersteunt GlobeTrotr Google, Discord, passkeys en authenticatorcodes.",
        descriptionEn:
          "Alongside email, GlobeTrotr supports Google, Discord, passkeys and authenticator codes.",
      },
      {
        kind: "improved",
        title: "Communicatievoorkeuren",
        titleEn: "Communication preferences",
        description:
          "Gebruikers kiezen welke uitnodigingen, reisupdates en betaalberichten zij per e-mail ontvangen.",
        descriptionEn:
          "Users choose which invitations, trip updates and payment messages they receive by email.",
      },
      {
        kind: "new",
        title: "Privacyverzoeken volgen",
        titleEn: "Track privacy requests",
        description: "Privacyverzoeken kunnen vanuit het account worden ingediend en gevolgd.",
        descriptionEn: "Privacy requests can be submitted and tracked from the account.",
      },
      {
        kind: "new",
        title: "Bedrijfsmail en postvakken",
        titleEn: "Company email and mailboxes",
        description:
          "Bevoegde medewerkers kunnen gedeelde en persoonlijke postvakken met een vaste handtekening gebruiken.",
        descriptionEn:
          "Authorised staff can use shared and personal mailboxes with a consistent signature.",
      },
    ],
  },
  {
    id: "2026-09-14-travel-tools",
    version: "Beta 0.15",
    publishedAt: "2026-09-14T12:00:00+02:00",
    title: "Meer gereedschap voor onderweg",
    titleEn: "More tools for the road",
    summary:
      "Reisstatistieken, taken, exports en een rustiger dagoverzicht maken lange reizen overzichtelijker.",
    summaryEn:
      "Trip statistics, tasks, exports and a calmer daily view make longer trips easier to manage.",
    changes: [
      {
        kind: "new",
        title: "Reisstatistieken en budgettempo",
        titleEn: "Trip statistics and budget pace",
        description:
          "Bekijk reisdagen, landen, boekingen, uitgaven per categorie en de verwachte budgetontwikkeling.",
        descriptionEn:
          "See travel days, countries, bookings, spending by category and projected budget progress.",
      },
      {
        kind: "new",
        title: "Taken en Vandaag",
        titleEn: "Tasks and Today",
        description:
          "Verdeel reistaken en bekijk onderweg alleen wat voor de huidige dag van belang is.",
        descriptionEn:
          "Assign trip tasks and see only what matters for the current day while travelling.",
      },
      {
        kind: "improved",
        title: "Route en reisversies",
        titleEn: "Route and trip versions",
        description:
          "Keer een route om, maak een conceptkopie en vergelijk route, boekingen en budget.",
        descriptionEn:
          "Reverse a route, create a draft copy and compare route, bookings and budget.",
      },
    ],
  },
  {
    id: "2026-09-12-agency-operations",
    version: "Beta 0.14",
    publishedAt: "2026-09-12T20:00:00+02:00",
    title: "Agency als werkruimte",
    titleEn: "Agency as a workspace",
    summary:
      "Reisorganisaties beheren klanten, offertes, teamrechten en branding vanuit één omgeving.",
    summaryEn:
      "Travel organisations manage clients, quotes, team permissions and branding from one workspace.",
    changes: [
      {
        kind: "new",
        title: "Klanten en offertes",
        titleEn: "Clients and quotes",
        description:
          "Maak offertes met varianten, deel ze veilig en zet een geaccepteerd voorstel om naar een reis.",
        descriptionEn:
          "Create quotes with variants, share them securely and convert an accepted proposal into a trip.",
      },
      {
        kind: "secure",
        title: "Rollen en audit",
        titleEn: "Roles and audit",
        description: "Teamrechten begrenzen toegang en belangrijke beheeracties worden vastgelegd.",
        descriptionEn:
          "Team permissions restrict access and important administrative actions are recorded.",
      },
      {
        kind: "improved",
        title: "Eigen uitstraling",
        titleEn: "Custom branding",
        description:
          "Agency-reizen gebruiken een organisatienaam, accentkleur en gecontroleerde domeinkoppeling.",
        descriptionEn:
          "Agency trips use an organisation name, accent colour and verified domain connection.",
      },
    ],
  },
  {
    id: "2026-09-10-public-beta",
    version: "Beta 0.13",
    publishedAt: "2026-09-10T18:00:00+02:00",
    title: "Publieke beta en beheer",
    titleEn: "Public beta and administration",
    summary:
      "De publieke website, feedbackstroom en Corporate Admin zijn klaargemaakt voor een beheerste beta.",
    summaryEn:
      "The public website, feedback flow and Corporate Admin were prepared for a controlled beta.",
    changes: [
      {
        kind: "new",
        title: "Feedback en bekende problemen",
        titleEn: "Feedback and known issues",
        description:
          "Testers kunnen feedback indienen en beheerders volgen problemen, reacties en productstatus.",
        descriptionEn:
          "Testers can submit feedback while administrators track issues, replies and product status.",
      },
      {
        kind: "improved",
        title: "Duidelijkere website",
        titleEn: "Clearer website",
        description:
          "Product, prijzen, contact, status, roadmap en juridische informatie hebben ieder een duidelijke plek.",
        descriptionEn:
          "Product, pricing, contact, status, roadmap and legal information each have a clear place.",
      },
      {
        kind: "secure",
        title: "Europese infrastructuur en privacy",
        titleEn: "European infrastructure and privacy",
        description:
          "De website legt primaire opslag in Frankfurt, Duitse applicatieservers en privacykeuzes uit.",
        descriptionEn:
          "The website explains primary storage in Frankfurt, German application servers and privacy choices.",
      },
    ],
  },
  {
    id: "2026-09-07-core-planner",
    version: "Beta 0.12",
    publishedAt: "2026-09-07T23:34:00+02:00",
    title: "De reisplanner staat",
    titleEn: "The trip planner is ready",
    summary:
      "De basis voor gezamenlijk plannen, boeken, uitgaven bijhouden en reizen delen is beschikbaar.",
    summaryEn:
      "The foundation for planning together, tracking bookings and expenses, and sharing trips is available.",
    changes: [
      {
        kind: "new",
        title: "Planning en route",
        titleEn: "Planning and route",
        description: "Bestemmingen, dagplanning, boekingen en routekaart komen samen in één reis.",
        descriptionEn:
          "Destinations, daily planning, bookings and the route map come together in one trip.",
      },
      {
        kind: "new",
        title: "Uitgaven en verrekening",
        titleEn: "Expenses and settlement",
        description: "Houd uitgaven in meerdere valuta bij en bereken wie nog aan wie betaalt.",
        descriptionEn: "Track expenses in multiple currencies and calculate who still owes whom.",
      },
      {
        kind: "secure",
        title: "Samenwerken met rollen",
        titleEn: "Collaborate with roles",
        description: "Eigenaar, reiziger, kijker en financiële rollen krijgen passende toegang.",
        descriptionEn: "Owner, traveller, viewer and finance roles receive appropriate access.",
      },
    ],
  },
];
