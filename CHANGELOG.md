# GlobeTrotr changelog

Dit technische changelog groepeert de huidige releasegeschiedenis. Detailwijzigingen blijven via Git beschikbaar. Alleen bevestigde publieke releases verschijnen op de website.

## 22 september 2026 — portal en Agency-ingang

### Uitgerold in `5df0590`

- De publieke website blijft op `globetrotr.nl`; registratie, login en dashboards openen op `portal.globetrotr.nl`.
- Oude privélinks worden tijdelijk met behoud van pad doorgestuurd.
- Een geregistreerd Agency-domein met actief plan krijgt een gecontroleerde ingang naar de verwachte workspace; onbekende hosts en verkeerde Agency-accounts worden geweigerd.
- Mailboxwachtwoorden tonen een gemaskeerde opgeslagen status.
- Corporate Admin beheert HTML-handtekeningen, incidenten en het privacyarchief.
- Ontvangen HTML-mail heeft een groter leesvenster, veilige inline afbeeldingen en bewuste toestemming voor externe afbeeldingen.
- Dashboard, mobiele reisnavigatie, publieke pagina's, privacytekst en releasechecks zijn bijgewerkt.

### Klaar voor kleine vervolguitrol

- Logo, Website/Home en publieke menu- en footerlinks gaan vanaf portal rechtstreeks naar `globetrotr.nl`.
- Publieke routes onder de portalhost krijgen ook serverzijdig een 302 naar de website.
- Header, hoofdnavigatie, meldingsknop, modals, homepage, About en dashboard schalen rustiger op smalle schermen, met grotere aanraakvlakken en CTA's die niet buiten beeld lopen.
- Privacy- en browseropslagteksten zijn opnieuw vergeleken met de gebruikte leveranciers en frontendopslag; Central EU (Frankfurt, `eu-central-1`) is als daadwerkelijke Supabase-regio vastgelegd.
- De product- en concurrentiecontrole is vernieuwd op basis van de officiële pagina's van Wanderlog, TripIt, Travefy, TravelSpend, Polarsteps en Roadtrippers. Boekingsmailconcepten, Agency-klantformulieren en herbruikbare Agency-inhoud staan als eerstvolgende kandidaten op de roadmap.
- De roadmapaudit onderscheidt nu gebouwd, gedeeltelijk gebouwd en ontbrekend werk. Een uitbreidingslijn voor het zoeken en vergelijken van verblijven, vluchten, vervoer en activiteiten is toegevoegd, inclusief partner-, prijs- en privacyvoorwaarden.
- `FEATURE_GAP_AND_EXPANSION.md` bundelt voortaan los van de uitrolhandleiding alle ontbrekende roadmapfuncties, concurrentieverschillen, integratiekeuzes en aanbevolen bouwvolgorde.
- `BUILD_PLAN.md` vertaalt deze analyse naar acht begrensde functiereleases, beginnend met provider-onafhankelijke reisopties en vergelijking na afronding van de portaluitrol.
- Migratie 1480 voegt hiervoor een gerichte Corporate Admin-acceptatiecontrole toe.
- Reizigers kunnen verblijf-, vlucht-, vervoer-, huurauto- en activiteitsopties eerst als kandidaat bewaren, maximaal vier opties vergelijken en een definitieve keuze één keer omzetten naar een boeking. Migratie 1490 voegt de productieacceptatie toe.

## 21 september 2026 — betaling, agenda en communicatie

- Paddle activeert terugkerende abonnementen en losse vooruitbetaalde maanden; meerdere losse betalingen stapelen de toegang.
- Kortings- en nul-eurotransacties worden correct verwerkt; facturen worden alleen getoond wanneer Paddle werkelijk een factuur heeft uitgegeven.
- Betaalmeldingen volgen de profieltaal en webhookherstel heeft gerichte diagnose.
- Losse ICS, live agenda, GPX en reisgids zijn aangesloten.
- Servicemails, uitnodigingen en kritieke storingsmail gebruiken nette HTML en NL/EN-inhoud.
- Bedrijfsmail ondersteunt HTML, veilige handtekeningen, gesprekken, bijlagen, IMAP-diagnose en gecontroleerd opnieuw bezorgen.
- Gratis NL/EN-vertaalconcepten zijn beschikbaar met handmatige controle.

## 14–20 september 2026 — productieplatform

- Eigen VPS-web/workerarchitectuur, Caddy, SMTP-relay, IMAP-sync en gezondheidscontroles.
- Google, Discord, passkeys en TOTP via Supabase Auth.
- Paddle Checkout, abonnementsbeheer en betaaldiagnose.
- Corporate Admin voor governance, contact, feedback, problemen, meldingen, facturen en mailboxen.
- Agency Admin voor teamrechten, klanten, offertes, taken, leveranciers, rapportage, branding en domeinverificatie.
- Privacy-, cookie-, voorwaarden- en terugbetalingsinformatie voor betaalde productie.

## 7–13 september 2026 — reisproduct en beta

- Reizen, routes, boekingen, dagplanning, taken, paklijsten, documenten en Vandaag-scherm.
- Uitgaven, valuta, slimme verrekening, budgettempo en statistieken.
- Delen met reisgenoten en klanten, openbare reizen en moderatie.
- GPX, PDF, JSON, CSV en agenda-export.
- Feedback, meldingen, status, onderhoud, auditlogs en releasechecklist.

## Onderhoudsafspraken

- Voeg alleen een korte, gegroepeerde release bovenaan toe.
- Zet niet-uitgerolde wijzigingen duidelijk onder een voorbereide vervolguitrol.
- Noem geen interne secrets, persoonsgegevens of testadressen.
- Werk bij iedere functionele stap ook de interne roadmap, publieke roadmap, publieke changelog en Corporate Admin-testchecklist bij.
