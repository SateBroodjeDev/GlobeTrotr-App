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
  ],
} as const;

/** Public-safe release notes. Never include secrets, private data or internal identifiers. */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    id: "2026-09-10-agency-audit-log",
    version: "Beta 0.36",
    publishedAt: "2026-09-10T19:36:00+02:00",
    title: "Inzicht in Agency-beheeracties",
    titleEn: "Visibility into Agency administration",
    summary: "Agency-eigenaren zien wie belangrijke wijzigingen heeft uitgevoerd en wanneer dat gebeurde.",
    summaryEn: "Agency owners can see who performed important changes and when they occurred.",
    changes: [
      {kind:"new",title:"Agency-activiteit",titleEn:"Agency activity",description:"Een afzonderlijk overzicht toont recente wijzigingen aan klanten, team, rechten en huisstijl.",descriptionEn:"A dedicated overview shows recent changes to clients, team access, permissions and branding."},
      {kind:"secure",title:"Onveranderbare geschiedenis",titleEn:"Immutable history",description:"Bestaande auditregels kunnen niet via de app worden aangepast of verwijderd.",descriptionEn:"Existing audit entries cannot be changed or deleted through the application."},
      {kind:"secure",title:"Beperkte context",titleEn:"Limited context",description:"De log bewaart geen uitnodigingstokens, klantnotities of volledige gewijzigde records.",descriptionEn:"The log does not store invitation tokens, client notes or complete changed records."},
    ],
  },
  {
    id: "2026-09-10-agency-work-queue",
    version: "Beta 0.35",
    publishedAt: "2026-09-10T19:28:00+02:00",
    title: "Een werkvoorraad voor Agency-teams",
    titleEn: "A work queue for Agency teams",
    summary: "Aankomende reizen en concrete aandachtspunten staan samen in een helder operationeel overzicht.",
    summaryEn: "Upcoming trips and actionable items are combined in a clear operational overview.",
    changes: [
      {kind:"new",title:"Actuele werkvoorraad",titleEn:"Live work queue",description:"Bekijk aankomende reizen, onvolledige boekingen, declarabele kosten en verlopen teamuitnodigingen.",descriptionEn:"Review upcoming trips, incomplete bookings, billable expenses and expired team invitations."},
      {kind:"improved",title:"Direct naar de juiste reis",titleEn:"Open the relevant trip",description:"Ieder reisgebonden aandachtspunt leidt direct naar de bijbehorende reis.",descriptionEn:"Every trip-related action item links directly to the relevant trip."},
      {kind:"secure",title:"Rechtenbewuste cijfers",titleEn:"Permission-aware figures",description:"Alleen Agency-teamleden met analyserechten ontvangen de compacte operationele gegevens.",descriptionEn:"Only Agency team members with analytics permission receive the compact operational data."},
    ],
  },
  {
    id: "2026-09-10-agency-client-profiles",
    version: "Beta 0.34",
    publishedAt: "2026-09-10T19:21:00+02:00",
    title: "Klantprofielen voor Agency",
    titleEn: "Client profiles for Agency",
    summary: "Agency-teams beheren klantgegevens en gekoppelde reizen vanuit één compact overzicht.",
    summaryEn: "Agency teams manage client details and linked trips from one compact overview.",
    changes: [
      {kind:"new",title:"Centraal klantprofiel",titleEn:"Central client profile",description:"Bewaar contactgegevens, voorkeurstaal en interne notities los van het interne Agency-team.",descriptionEn:"Store contact details, preferred language and internal notes separately from the internal Agency team."},
      {kind:"improved",title:"Reisgeschiedenis gekoppeld",titleEn:"Linked trip history",description:"Koppel één klant veilig aan meerdere reizen en open de bijbehorende reis direct vanuit het profiel.",descriptionEn:"Securely link one client to multiple trips and open the corresponding trip directly from the profile."},
      {kind:"improved",title:"Operatie binnen Agency Admin",titleEn:"Operations inside Agency Admin",description:"Reis- en kostencijfers staan nu in dezelfde vaste beheeromgeving als klanten, organisatie en rechten.",descriptionEn:"Trip and expense figures now share the same administration area as clients, organisation and permissions."},
      {kind:"secure",title:"Alles of niets opgeslagen",titleEn:"Atomic profile storage",description:"Profiel en reiskoppelingen worden samen opgeslagen en alleen met het juiste Agency-recht.",descriptionEn:"The profile and trip links are saved together and only with the required Agency permission."},
    ],
  },
  {
    id: "2026-09-10-agency-branding-sync",
    version: "Beta 0.33",
    publishedAt: "2026-09-10T16:58:00+02:00",
    title: "Agency-huisstijl direct zichtbaar",
    titleEn: "Agency branding updates instantly",
    summary: "Naam, tagline, kleur en logo worden direct toegepast en Agency-beheer blijft overzichtelijk bij grotere teams.",
    summaryEn: "Name, tagline, colour and logo are applied immediately, while Agency management remains clear for larger teams.",
    changes: [
      {kind:"fixed",title:"Directe merkverversing",titleEn:"Instant brand refresh",description:"Opgeslagen Agency-instellingen verversen meteen de navigatie en actieve workspace.",descriptionEn:"Saved Agency settings immediately refresh navigation and the active workspace."},
      {kind:"fixed",title:"Betrouwbare logowijziging",titleEn:"Reliable logo updates",description:"Nieuwe logo's krijgen een unieke versie, worden direct opgeslagen en vervangen de oude afbeelding zonder browsercache.",descriptionEn:"New logos receive a unique version, are saved immediately and replace the old image without browser caching."},
      {kind:"improved",title:"Compact rechtenbeheer",titleEn:"Compact permission management",description:"Kies één teamlid om persoonlijke rechten te beheren, zodat grote Agency-teams overzichtelijk blijven.",descriptionEn:"Select one team member to manage personal permissions, keeping large Agency teams manageable."},
      {kind:"new",title:"Agency-beheer voor GlobeTrotr",titleEn:"Agency controls for GlobeTrotr",description:"Corporate Admin kan Agency-instellingen gecontroleerd bekijken en met een gelogde reden corrigeren.",descriptionEn:"Corporate Admin can review Agency settings and correct them with an audited reason."},
      {kind:"secure",title:"Rechten gelden ook achter de schermen",titleEn:"Permissions enforced behind the scenes",description:"Organisatie-instellingen, teambeheer en analyses controleren de effectieve rol ook bij directe serveraanroepen.",descriptionEn:"Organisation settings, team management and analytics verify effective roles during direct server calls as well."},
    ],
  },
  {
    id: "2026-09-09-trip-branding",
    version: "Beta 0.32",
    publishedAt: "2026-09-09T22:04:00+02:00",
    title: "Een eigen uitstraling per Agency-reis",
    titleEn: "Custom branding for each Agency trip",
    summary: "Een Agency kan een specifieke reis een eigen naam, domein, tagline en accentkleur geven.",
    summaryEn: "An Agency can give a specific trip its own name, domain, tagline and accent colour.",
    changes: [
      { kind: "new", title: "Reishuisstijl", titleEn: "Trip branding", description: "Reisinstellingen bevatten een eigen brandingsectie met direct voorbeeld en duidelijke veldgrenzen.", descriptionEn: "Trip settings include a dedicated branding section with an instant preview and clear field limits." },
      { kind: "improved", title: "Agency-standaard behouden", titleEn: "Agency defaults preserved", description: "Lege velden gebruiken de Agency-huisstijl en met één actie wordt de volledige reisafwijking uitgeschakeld.", descriptionEn: "Empty fields use Agency branding, and one action disables the complete trip override." },
      { kind: "secure", title: "Afgeschermd beheer", titleEn: "Protected management", description: "Alleen een actief Agency-lid met brandingrechten kan de reishuisstijl bekijken of aanpassen.", descriptionEn: "Only an active Agency member with branding permission can view or change trip branding." },
      { kind: "improved", title: "Dezelfde stijl bij delen en exporteren", titleEn: "Consistent sharing and exports", description: "De openbare reis, PDF en reisgids gebruiken automatisch de effectieve reishuisstijl.", descriptionEn: "The public trip, PDF and trip guide automatically use the effective trip branding." },
    ],
  },
  {
    id: "2026-09-09-agency-admin-shell",
    version: "Beta 0.31",
    publishedAt: "2026-09-09T22:00:00+02:00",
    title: "Een helder Agency-beheerdashboard",
    titleEn: "A clear Agency administration dashboard",
    summary: "Agency-beheer is verdeeld over duidelijke pagina's en past zich aan de rechten van ieder teamlid aan.",
    summaryEn: "Agency administration is divided into clear pages and adapts to each team member's permissions.",
    changes: [
      { kind: "improved", title: "Vaste beheerindeling", titleEn: "Consistent administration layout", description: "Overzicht, organisatie, rechten, klanten, operatie en abonnement hebben een vaste navigatie op desktop en mobiel.", descriptionEn: "Overview, organisation, permissions, clients, operations and plan have consistent navigation on desktop and mobile." },
      { kind: "secure", title: "Menu's volgens rechten", titleEn: "Permission-aware menus", description: "Een teamlid ziet alleen de beheeronderdelen die bij de Agency-rol en persoonlijke uitzonderingen horen.", descriptionEn: "Team members only see administration areas granted by their Agency role and personal exceptions." },
      { kind: "improved", title: "Betrouwbare merkterugval", titleEn: "Reliable brand fallback", description: "De merkweergave gebruikt één vaste volgorde en valt buiten een actief Agency-plan automatisch terug op GlobeTrotr.", descriptionEn: "Brand presentation uses one consistent hierarchy and automatically falls back to GlobeTrotr without an active Agency plan." },
    ],
  },
  {
    id: "2026-09-09-agency-permissions",
    version: "Beta 0.30",
    publishedAt: "2026-09-09T21:55:00+02:00",
    title: "Precieze rechten voor ieder Agency-team",
    titleEn: "Precise permissions for every Agency team",
    summary: "Een Agency bepaalt standaardrechten per rol en kan die waar nodig voor één teamlid aanpassen.",
    summaryEn: "An Agency sets default permissions per role and can adjust them for an individual team member where needed.",
    changes: [
      {kind:"new",title:"Rollenmatrix",titleEn:"Role permission matrix",description:"Advisor en Finance hebben duidelijke, aanpasbare rechten voor reizen, planning, uitgaven en beheer.",descriptionEn:"Advisor and Finance have clear, configurable permissions for trips, planning, expenses and management."},
      {kind:"improved",title:"Uitzondering per gebruiker",titleEn:"Per-user exceptions",description:"Een teamlid kan een gericht extra of beperkt recht krijgen zonder de hele rol te veranderen.",descriptionEn:"A team member can receive a targeted additional or restricted permission without changing the whole role."},
      {kind:"secure",title:"Controle op de server",titleEn:"Server-side enforcement",description:"Reisgegevens buiten iemands effectieve rechten worden niet door een browserwijziging overschreven.",descriptionEn:"Trip data outside a person's effective permissions cannot be overwritten by a browser change."},
    ],
  },
  {
    id: "2026-09-09-agency-settings",
    version: "Beta 0.29",
    publishedAt: "2026-09-09T21:39:00+02:00",
    title: "Agency-instellingen krijgen een eigen plek",
    titleEn: "A dedicated place for Agency settings",
    summary: "Organisatiegegevens, merkuitstraling en het Agency-logo zijn overzichtelijk en veilig samen te beheren.",
    summaryEn: "Organisation details, brand appearance and the Agency logo can be managed together safely and clearly.",
    changes: [
      { kind: "new", title: "Eigen instellingendashboard", titleEn: "Dedicated settings dashboard", description: "Taal, valuta, tijdzone, contactgegevens en branding staan bij elkaar met een direct voorbeeld.", descriptionEn: "Language, currency, timezone, contact details and branding are grouped with an instant preview." },
      { kind: "secure", title: "Afgeschermd Agency-logo", titleEn: "Protected Agency logo", description: "Logo's hebben vaste bestands- en groottelimieten en worden alleen voor de juiste workspace opgeslagen.", descriptionEn: "Logos have fixed file and size limits and are stored only for the correct workspace." },
      { kind: "improved", title: "Duidelijke veldgrenzen", titleEn: "Clear field limits", description: "Tekentellers en veilige standaardwaarden voorkomen lege instellingen en overlopende organisatienamen.", descriptionEn: "Character counters and safe defaults prevent empty settings and overflowing organisation names." },
    ],
  },
  {
    id: "2026-09-09-agency-team-management",
    version: "Beta 0.28",
    publishedAt: "2026-09-09T21:19:00+02:00",
    title: "Agency-teams vanuit één plek beheren",
    titleEn: "Manage Agency teams from one place",
    summary: "Agency-eigenaren kunnen interne teamleden veilig uitnodigen en hun workspacebrede toegang beheren.",
    summaryEn: "Agency owners can securely invite internal team members and manage their workspace-wide access.",
    changes: [
      { kind: "new", title: "Veilige Agency-uitnodiging", titleEn: "Secure Agency invitation", description: "Adviseurs en financiële medewerkers krijgen een tijdelijke link en, bij een bestaand account, een melding om zelf te accepteren of weigeren.", descriptionEn: "Advisors and finance team members receive a temporary link and, for an existing account, a notification to accept or decline." },
      { kind: "improved", title: "Teambeheer in Agency Admin", titleEn: "Team management in Agency Admin", description: "De eigenaar kan rollen wijzigen, toegang blokkeren of herstellen en een lid uit het team verwijderen.", descriptionEn: "The owner can change roles, suspend or restore access and remove a member from the team." },
      { kind: "secure", title: "Workspacebrede rechten", titleEn: "Workspace-wide permissions", description: "Alleen actieve interne Agency-leden krijgen toegang tot alle reizen; klanten blijven gekoppeld aan hun eigen reis.", descriptionEn: "Only active internal Agency members receive access to all trips; clients remain linked to their own trip." },
    ],
  },
  {
    id: "2026-09-09-agency-workspaces",
    version: "Beta 0.27",
    publishedAt: "2026-09-09T20:50:00+02:00",
    title: "Agency-teams krijgen een veilig fundament",
    titleEn: "A secure foundation for Agency teams",
    summary:
      "Interne teamleden kunnen straks vanuit één Agency-workspace samenwerken, met duidelijke rollen en afgescheiden klanttoegang.",
    summaryEn:
      "Internal team members will be able to collaborate from one Agency workspace with clear roles and separated client access.",
    changes: [
      {
        kind: "secure",
        title: "Vaste organisatie-identiteit",
        titleEn: "Stable organisation identity",
        description:
          "Workspaces en hun reizen zijn voortaan via een vaste organisatie-ID verbonden, los van tijdelijke browsergegevens.",
        descriptionEn:
          "Workspaces and their trips are now linked through a stable organisation ID, independent of temporary browser data.",
      },
      {
        kind: "new",
        title: "Interne Agency-rollen",
        titleEn: "Internal Agency roles",
        description:
          "De database onderscheidt eigenaar, reisadviseur en financiën en koppelt iedere rol aan passende reisrechten.",
        descriptionEn:
          "The database distinguishes owner, travel advisor and finance roles and maps each role to appropriate trip access.",
      },
      {
        kind: "secure",
        title: "Klanten blijven reisgebonden",
        titleEn: "Clients remain trip-specific",
        description:
          "Een klant krijgt nooit automatisch toegang tot andere reizen of de interne Agency-workspace.",
        descriptionEn:
          "A client never automatically receives access to other trips or the internal Agency workspace.",
      },
    ],
  },
  {
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
