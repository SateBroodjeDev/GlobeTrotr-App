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
    id: "2026-09-09-secure-trip-invitations",
    version: "Beta 0.14",
    publishedAt: "2026-09-09T12:15:00+02:00",
    title: "Zelf kiezen bij een reisuitnodiging",
    titleEn: "Choose how to respond to a trip invitation",
    summary: "Reisuitnodigingen werken nu via één beveiligde route met een duidelijke keuze om deel te nemen of te weigeren.",
    summaryEn: "Trip invitations now use one secure flow with a clear choice to join or decline.",
    changes: [
      { kind: "new", title: "Beveiligde uitnodigingslink", titleEn: "Secure invitation link", description: "Een reisbeheerder kan na het toevoegen van een reisgenoot direct een zeven dagen geldige link kopiëren en delen.", descriptionEn: "After adding a traveller, a trip manager can immediately copy and share a link that remains valid for seven days." },
      { kind: "new", title: "Accepteren of weigeren", titleEn: "Accept or decline", description: "De genodigde ziet de reis en aangeboden rol en beslist zelf of die wil deelnemen.", descriptionEn: "The invitee sees the trip and offered role and decides whether to join." },
      { kind: "new", title: "Antwoorden vanuit meldingen", titleEn: "Respond from notifications", description: "Bestaande accounts kunnen een reisuitnodiging rechtstreeks vanuit hun meldingen accepteren of weigeren.", descriptionEn: "Existing accounts can accept or decline a trip invitation directly from their notifications." },
      { kind: "secure", title: "Toegang pas na acceptatie", titleEn: "Access only after acceptance", description: "Alleen het account met het bevestigde uitgenodigde e-mailadres kan deelnemen; toevoegen alleen verleent geen toegang.", descriptionEn: "Only the account with the confirmed invited email address can join; being added alone does not grant access." },
      { kind: "improved", title: "Registreren vanuit een uitnodiging", titleEn: "Register from an invitation", description: "Nieuwe gebruikers keren na accountbevestiging terug naar dezelfde uitnodiging om hun keuze af te ronden.", descriptionEn: "New users return to the same invitation after confirming their account to complete their choice." },
    ],
  },
  {
    id: "2026-09-09-platform-administration",
    version: "Beta 0.13",
    publishedAt: "2026-09-09T10:30:00+02:00",
    title: "Overzichtelijker en veiliger platformbeheer",
    titleEn: "Clearer and safer platform administration",
    summary: "GlobeTrotr heeft het interne platformbeheer verdeeld over duidelijke pagina's en uitgebreid met veilige controles en gebruikersinzage.",
    summaryEn: "GlobeTrotr has divided internal platform administration into clear pages and added secure checks and user insights.",
    changes: [
      { kind: "secure", title: "Extra beveiliging voor platformbeheer", titleEn: "Additional platform administration security", description: "Beheertoegang wordt extra gecontroleerd en belangrijke beheeracties worden vastgelegd.", descriptionEn: "Administration access receives an additional check and important admin actions are recorded." },
      { kind: "improved", title: "Beter accountbeheer", titleEn: "Better account administration", description: "Geautoriseerd beheer kan accountinstellingen gecontroleerd corrigeren en gebruikersdetails met reis- en workspaceactiviteit bekijken.", descriptionEn: "Authorised administration can correct account settings in a controlled way and review user details with trip and workspace activity." },
      { kind: "secure", title: "Veilige accountblokkering", titleEn: "Secure account blocking", description: "Een account kan gecontroleerd worden geblokkeerd en hersteld met een verplichte reden en extra bevestiging.", descriptionEn: "An account can be blocked and restored in a controlled way with a required reason and extra confirmation." },
      { kind: "improved", title: "Duidelijke melding bij accountblokkering", titleEn: "Clear account blocking message", description: "Geblokkeerde gebruikers krijgen een Nederlandse of Engelse uitleg met het juiste contactadres.", descriptionEn: "Blocked users receive a Dutch or English explanation with the correct contact address." },
      { kind: "fixed", title: "Bestaande reisgenoten correct herkend", titleEn: "Existing travellers recognised correctly", description: "Een bestaand account ontvangt bij een exact overeenkomend reisgenootadres betrouwbaar een uitnodiging en kiest daarna zelf of het deelneemt.", descriptionEn: "An existing account reliably receives an invitation when its email exactly matches the traveller address and then chooses whether to join." },
      { kind: "fixed", title: "Donkere modus zonder witte flits", titleEn: "Dark mode without a white flash", description: "De gekozen weergave wordt bij vernieuwen toegepast voordat de pagina zichtbaar wordt.", descriptionEn: "The selected appearance is applied on refresh before the page becomes visible." },
      { kind: "secure", title: "Bewaakte platformstatus", titleEn: "Monitored platform status", description: "Beheer kan belangrijke technische diensten veilig controleren zonder vluchtquotum te verbruiken.", descriptionEn: "Administration can safely check important technical services without consuming flight quota." },
      { kind: "improved", title: "Eigen beheerpagina's", titleEn: "Dedicated administration pages", description: "Gebruikers, status, feedback, problemen en auditinformatie hebben ieder een compacte beheerpagina.", descriptionEn: "Users, status, feedback, issues and audit information each have a compact administration page." },
      { kind: "improved", title: "Aparte beheeromgeving", titleEn: "Separate administration environment", description: "Platformbeheer heeft een eigen rustige navigatie, los van reizen en Agency-onderdelen.", descriptionEn: "Platform administration has its own focused navigation, separate from trips and Agency sections." },
      { kind: "new", title: "Openbare roadmap", titleEn: "Public roadmap", description: "Bekijk waar GlobeTrotr nu aan werkt en welke verbeteringen hierna volgen.", descriptionEn: "See what GlobeTrotr is working on now and which improvements come next." },
      { kind: "improved", title: "Compactere navigatie", titleEn: "More compact navigation", description: "De footer groepeert belangrijke pagina's en herkenbare iconen maken informatie sneller vindbaar.", descriptionEn: "The footer groups important pages and recognisable icons make information easier to find." },
    ],
  },
  {
    id: "2026-09-08-beta-feedback",
    version: "Beta 0.12",
    publishedAt: "2026-09-08T16:10:00+02:00",
    title: "Feedback direct vanuit GlobeTrotr",
    titleEn: "Feedback directly from GlobeTrotr",
    summary: "Betatesters kunnen sneller problemen melden en de voortgang volgen via een openbare lijst.",
    summaryEn: "Beta testers can report problems faster and follow progress through a public list.",
    changes: [
      { kind: "new", title: "Feedbackknop op iedere pagina", titleEn: "Feedback button on every page", description: "Ingelogde testers kunnen via de vaste zijknop feedback insturen en daarbij een duidelijke categorie kiezen.", descriptionEn: "Signed-in testers can submit feedback through the fixed side button and select a clear category." },
      { kind: "new", title: "Openbare lijst met bekende problemen", titleEn: "Public known-issues list", description: "Bekijk per categorie welke problemen worden onderzocht, gepland of gemonitord.", descriptionEn: "See by category which problems are being investigated, planned or monitored." },
      { kind: "improved", title: "Sneller beheer van beta-feedback", titleEn: "Faster beta feedback management", description: "Het beheer gebruikt zoeken, categoriefilters en een duidelijk overzicht van open werk.", descriptionEn: "Administration now offers search, category filters and a clear overview of open work." },
      { kind: "improved", title: "Privacykeuzes op de juiste plek", titleEn: "Privacy choices in the right place", description: "Ingelogde gebruikers beheren browseropslag in Accountinstellingen; gasten gebruiken de footer.", descriptionEn: "Signed-in users manage browser storage in Account settings; guests use the footer." },
    ],
  },
  {
    id: "2026-09-08-privacy-controls",
    version: "Beta 0.11",
    publishedAt: "2026-09-08T15:20:00+02:00",
    title: "Duidelijke privacykeuzes",
    titleEn: "Clear privacy choices",
    summary: "Je ziet precies welke browseropslag GlobeTrotr gebruikt en houdt zelf controle over optionele voorkeuren.",
    summaryEn: "You can see exactly which browser storage GlobeTrotr uses and control optional preferences.",
    changes: [
      {
        kind: "new",
        title: "Privacykeuze bij eerste bezoek",
        titleEn: "Privacy choice on first visit",
        description: "Noodzakelijke opslag wordt helder uitgelegd en optionele taalopslag staat standaard uit. Je kunt je keuze later via de footer wijzigen.",
        descriptionEn: "Necessary storage is clearly explained and optional language storage is off by default. You can change your choice later through the footer.",
      },
      {
        kind: "improved",
        title: "Volledige privacy- en opslaguitleg",
        titleEn: "Complete privacy and storage information",
        description: "De privacyverklaring vermeldt gegevensdoelen, grondslagen, ontvangers, bewaartermijnen, rechten en alle gebruikte browseropslag.",
        descriptionEn: "The privacy notice lists data purposes, legal bases, recipients, retention, rights and all browser storage used.",
      },
      {
        kind: "improved",
        title: "Duidelijke beta-voorwaarden",
        titleEn: "Clear beta terms",
        description: "Deelname, veilig gebruik, reiscontroles, gebruikersinhoud en consumentenrechten zijn nu helder uitgewerkt.",
        descriptionEn: "Participation, safe use, travel checks, user content and consumer rights are now clearly explained.",
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
