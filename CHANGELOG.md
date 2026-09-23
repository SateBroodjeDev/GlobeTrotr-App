# GlobeTrotr changelog

Dit technische changelog groepeert de huidige releasegeschiedenis. Detailwijzigingen blijven via Git beschikbaar. Alleen bevestigde publieke releases verschijnen op de website.

## Update 1.1 — 23 september 2026

- Update 1.1 is uitgerold op Node-01 en Node-02 en staat nu als gebundelde release op de publieke updatepagina.
- De release bevat de Reisvergelijker met reacties en peilingen, Agency-klantformulieren, de contentbibliotheek, webpush, begrensde vluchtcontrole, het offline dagoverzicht met uitgavenwachtrij en controleerbare boekingsmailconcepten.
- De eigen Stalwart-mailserver en MX-overgang horen niet bij de voltooide applicatie-uitrol; die blijven een afzonderlijke migratie na aflever-, back-up- en hersteltests.

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

De onderstaande onderdelen zijn gebouwd maar nog niet als publieke productie-release bevestigd. De actuele mailstatus staat in [MAIL_STATUS.md](MAIL_STATUS.md).

- **Agency-klantformulieren en eigen mailhosting:** veilige tweetalige intakeformulieren zijn toegevoegd. Corp Admin kan persoonlijke, gedeelde en automatische `trip.*@globetrotr.nl`-postvakken laten provisionen op een afgeschermde Stalwart-mailserver; de DNS-cutover volgt pas na acceptatie.
- **Mailserverbeheer:** Corporate Admin toont de provisioningstatus en beperkte foutcode, kan een mislukte aanmaak bewust opnieuw starten en neemt de interne Stalwart-controle mee in de platformstatus.
- **Boekingsmail per reis:** planners kunnen een uniek `trip.*@globetrotr.nl`-adres maken. De IMAP-worker herkent veilige basisvelden, wijzigingen en annuleringen, blokkeert dubbele verwerking en maakt een bewerkbaar concept dat pas na bevestiging een boeking wordt. Intrekken en automatische verwijdering volgen de ingestelde bewaartermijn.
- **Agency-contentbibliotheek:** bestemmingen, accommodaties, activiteiten, dagblokken, teksten en media kunnen als persoonlijk concept of organisatie-item worden bewaard. Taal, tags, publicatiestatus, versiehistorie, bron, licentie, kopiëren en archiveren zijn opgenomen zonder bestaande sjablonen te vervangen. Een preview laat een vaste versie vervolgens eenmaal als planning, reisonderdeel of offertetekst toepassen; bestaande inhoud wordt niet overschreven.
- **Webpush per apparaat:** gebruikers kunnen vanuit het meldingenpaneel browserpush activeren of intrekken. De push toont bewust geen reis- of accountdetails, de worker bezorgt met VAPID, begrensde retries en automatische intrekking van verdwenen endpoints.
- **Automatische vluchtcontrole:** toekomstige vluchten van Pro- en Agency-reizen worden binnen zeven dagen begrensd gecontroleerd. De eerste controle legt alleen een basislijn vast; alleen wijzigingen in status, tijd, gate of terminal worden met cooldown en reisvoorkeur als melding aangeboden.
- **Offline onderweg:** een reiziger kan route, planning en praktische boekingsinformatie expliciet op het apparaat bewaren en per reisdag zonder netwerk openen. Nieuwe uitgaven kunnen in een begrensde lokale wachtrij worden gezet en worden alleen na een bewuste keuze veilig samengevoegd. Bestaande bedragen, boekingscodes en documenten blijven buiten het pakket; uitloggen wist de lokale kopie en wachtrij.

- Agency-klantformulieren zijn lokaal compleet: configureerbare NL/EN-velden met doel en bewaartermijn, beveiligde intrekbare links, HTML-uitnodiging, mobiele invulpagina, eenmalig indienen, review, verwerking naar klantvoorkeuren, JSON-export, audit en automatische verwijdering. Migratie/test 1550 en productieacceptatie staan nog open.

- De reisplanner gebruikt de naam **Vergelijker** en vraagt per categorie relevante gegevens: vlucht en route, verblijf en ontbijt, vervoerssoort, huurauto of activiteit. Het algemene invoerveld ‘Duur in minuten’ is verwijderd; tijdstippen bepalen waar van toepassing de reistijd. Migratie 1500 bewaart deze velden afzonderlijk na 1490. Nog niet gepubliceerd op de website als afgeronde release.
- Actieve reisleden kunnen per kandidaat een reactie plaatsen en hun eigen reactie verwijderen. De opslag is tot 1.000 tekens begrensd, volgt de bestaande reistoegang en verwijdert reacties met de kandidaat. Migratie 1510 en de bijbehorende acceptatietest staan klaar.
- Planners kunnen een peiling met twee tot vier kandidaten en een optionele deadline starten. Reisleden kunnen één stem uitbrengen, wijzigen of intrekken; planners kunnen de keuze afsluiten zonder automatisch te boeken. Migratie/test 1520 en een productieproef staan nog open.
- In-appmeldingen bij starten, deadline en afsluiten van een peiling respecteren bestaande reis- en Agency-voorkeuren. De HTML-mail volgt de accounttaal en `tripUpdates`-voorkeur. Een afgeschermd auditlog registreert de handelingen zonder reacties of gevoelige berichtinhoud. Migraties/tests 1530–1540 en productieacceptatie staan nog open.
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
