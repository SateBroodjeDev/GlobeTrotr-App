# GlobeTrotr

De gecontroleerde uitrol van de eigen SMTP/IMAP-server en automatische mailboxprovisioning staat in [MAIL_SERVER_DEPLOYMENT.md](MAIL_SERVER_DEPLOYMENT.md). Wijzig MX-records pas nadat de volledige acceptatietest daarin is geslaagd.

Voor de eerstvolgende uitrol gebruik je [het actuele uitrolhandboek](IMPLEMENTATION_PENDING.md). Dagelijks serverbeheer staat in [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md). [SUPABASE_PRODUCTION_MIGRATION.md](SUPABASE_PRODUCTION_MIGRATION.md) is alleen voor een volledig nieuw, leeg Supabase-project.

GlobeTrotr is een meertalige reisplanner voor individuen, groepen en reisorganisaties. De applicatie combineert routes, planning, boekingen, uitgaven, kostenverdeling, paklijsten, openbare reisverhalen en samenwerking in één workspace.

Beta 0.9 draait op eigen GlobeTrotr-infrastructuur. E-mail/wachtwoord, passkey, Google en Discord zijn aangesloten. Transactionele en bedrijfsmail lopen via ZXCS en de afgeschermde relay. Paddle is live gekoppeld. Release 1.0 staat gepland voor 1 oktober 2026 en volgt alleen na de vrijgavecontrole uit het uitrolhandboek.

## Wat de applicatie bevat

- Meerdere reizen met sjablonen, data, bestemmingen en een interactieve OpenStreetMap-route.
- Controle op ontbrekende hotelnachten met een begrensde OpenStreetMap-zoekactie en opslag in de Reisvergelijker.
- Chronologisch reisschema, boekingen, vluchtinformatie, vervoer en paklijsten.
- Uitgaven in meerdere valuta, live ECB-koersen, slimme verrekening en veilige CSV/PDF-export.
- Brandstofprognoses per vervoerstype en koppeling met werkelijke tankuitgaven.
- Beveiligde samenwerking per reis met rollen, uitnodigingslink, accountmelding, accepteren, weigeren, vernieuwen en intrekken.
- Openbare reispagina's met kaart, planning, optioneel gedeelde boekingen, PIN-bescherming en weer.
- JSON-back-up per reis, volledige workspaceback-up, veilige import en AVG-gegevensexport.
- Agenda-export van dagplanning en boekingen naar gangbare agenda-apps.
- Reisdatums gezamenlijk verschuiven met een impactpreview voor stops, dagplanning, boekingen en kandidaten, zonder historische uitgaven te wijzigen.
- Reisstatistieken met reisduur, bestemmingen, overnachtingen, uitgavenverdeling, daggemiddelde en budgetprognose.
- Veilige reisduplicatie voor een private routevariant zonder deelnemers, uitgaven, boekingsreferenties of deelinstellingen over te nemen.
- GPX-export van de route en gecontroleerd omkeren van de bestemmingsvolgorde.
- Vergelijking van twee reizen op periode, route, boekingen, budget en omgerekende uitgaven.
- Persistente meldingen, platformstatusbanners, feedback en een publieke lijst met bekende problemen.
- Een afzonderlijke Agency Admin met organisatie-instellingen, private logo-opslag, centrale en per-reisbranding, interne teamrollen, persoonlijke rechten, klantprofielen, operationele werkvoorraad en append-only auditlog.
- Afgeschermd Corporate Admin-dashboard voor gebruikers, platformstatus, feedbackgesprekken, openbare-reismoderatie, privacyverzoeken, onderhoud, problemen en auditlog.

## Techniek

- React 19 en TypeScript
- TanStack Router, Start en React Query
- Vite 8 en Nitro als Node-container
- Tailwind CSS en Radix UI-componenten
- Supabase Auth, PostgreSQL, Row Level Security en voorlopig Supabase Storage
- Leaflet en OpenStreetMap

Gevoelige databasebewerkingen lopen via geauthenticeerde serverfuncties en service-role-only RPC's. Publieke reisroutes gebruiken afzonderlijke RPC's die uitsluitend geselecteerde openbare velden teruggeven.

## Lokaal ontwikkelen

Vereisten:

- Node.js 24
- npm; Bun is alleen nodig wanneer je lokaal exact dezelfde lockfile-installatie als CI wilt gebruiken
- Een gekoppeld Supabase-project en de vereiste omgevingsvariabelen

```sh
git clone <repository-url>
cd globetrotr-1d042353
npm install
npm run dev
```

Plaats secrets uitsluitend in de afgeschermde serveromgeving en commit nooit `.env`-bestanden, SMTP-wachtwoorden, Paddle-webhooksecrets of service-role-sleutels.

## Controles

```sh
npm test
npm run build
npm run check
```

`npm run verify` voert ESLint, regressietests, TypeScript, de beveiligingsaudit, release-preflight en workersyntaxis uit. `npm run check` voegt de productiebuild toe. De lockfile is `package-lock.json`. Een lokale Windows-build kan bij Nitro-bestandstracing door `EPERM` stranden; CI en de Linux-build op Node-01 blijven daarom beslissend.

Database-regressietests staan in `supabase/tests`. Voer ze in de Supabase SQL Editor uit nadat de genoemde migratie is toegepast. Sommige zijn alleen-lezen, andere draaien in een transactie met `ROLLBACK`; controleer de kop van ieder bestand.

Voor een volledige handmatige betacontrole staat een compacte afvinklijst in [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md).

## Databasewijzigingen

Migraties staan chronologisch in `supabase/migrations` en worden in bestandsvolgorde uitgevoerd. Recente onderdelen omvatten versiegestuurde reisopslag, financiële privacy, publieke reis-RPC's, uitnodigingsbeheer, meldingen, Agency-workspaces, klantprofielen en gescheiden auditregistratie voor Corporate en Agency Admin.

Volgens de eigenaar zijn migraties en tests tot en met **1650** uitgevoerd. Voor release 1.0 staan 1660, 1670, 1680 en 1690 met hun tests open. Zie [het uitrolhandboek](IMPLEMENTATION_PENDING.md), de [interne roadmap](roadmap.md), het [bouwplan](BUILD_PLAN.md) en de [functie-gapanalyse](FEATURE_GAP_AND_EXPANSION.md).

De productie-beta gebruikt één Hetzner-VPS voor webapp en Caddy en een tweede voor worker, mailrelay en IMAP-sync. Supabase is de beheerde database-, Auth- en Storage-laag in Central EU (Frankfurt, `eu-central-1`). [`STORAGE_ARCHITECTURE.md`](STORAGE_ARCHITECTURE.md) beschrijft een mogelijke latere verplaatsing naar Hetzner Object Storage.

De productiecontainers gebruiken `Dockerfile`, `deploy/web.compose.yml` en `deploy/worker.compose.yml`. De worker en mailrelay draaien op Node-02. De actuele e-mailmodus staat in Supabase `email_delivery_config`; ga niet uit van testmodus. Zie [`worker/README.md`](worker/README.md).

De bestaande productie-beta verstuurt en ontvangt mail via ZXCS. Eigen Stalwart-hosting en boekingsmail per reis zijn lokaal gebouwd en wachten op migraties 1560–1580, Node-02-configuratie en productieacceptatie. [MAIL_STATUS.md](MAIL_STATUS.md) geeft per onderdeel exact aan wat nu werkt en wat nog moet gebeuren.

De eerste installatie staat in [`VPS_DEPLOYMENT.md`](VPS_DEPLOYMENT.md). Updates, herstarts, logs, healthchecks en rollback staan uitsluitend in [`SERVER_OPERATIONS.md`](SERVER_OPERATIONS.md).

De bijbehorende SQL-tests staan in `supabase/tests` en noemen bovenaan welke migratie eerst vereist is.

### Agency Admin

- `/agency-admin`: workspaceoverzicht en teambeheer.
- `/agency-admin/settings`: organisatiegegevens, standaardtaal, valuta, tijdzone, domein, accentkleur en logo.
- `/agency-admin/permissions`: standaardrechten per rol en persoonlijke uitzonderingen.
- `/agency-admin/clients`: klantprofielen en gekoppelde reizen. Migratie 1270 koppelt een vooraf aangemaakte klant na bevestigde registratie; tenantisolatie en de volledige uitnodigingsstroom blijven onderdeel van de productieacceptatie.
- `/agency-admin/suppliers`: herbruikbare accommodaties, vervoerders en activiteiten met contactgegevens, afspraken, commissie, archief en reiskoppelingen.
- `/contact`: publiek contactformulier met Cloudflare Turnstile; bevoegde medewerkers behandelen berichten via `/corporate-admin/contact`.
- `/agency-admin/operations`: portfolio, kosten en concrete aandachtspunten uit relationele reisdata.
- `/agency-admin/quotes`: interne offertes met klant, optionele reis, geldigheid en meerdere prijsvarianten.
- `/agency-admin/quotes/:quoteId/convert`: controlepagina om een geaccepteerde offerte aan een bestaande reis te koppelen of als nieuwe privéreis aan te maken.
- `/quote/:token`: tijdelijke, beveiligde klantweergave van een deelklare Agency-offerte.
- `/agency-admin/tasks`: taken, prioriteiten, deadlines en toewijzingen aan teamleden.
- `/agency-admin/templates`: herbruikbare programma's, paklijsten en klantteksten.
- Dezelfde pagina bevat de versieerbare contentbibliotheek voor bestemmingen, accommodaties, activiteiten, dagblokken, teksten en media, met preview en eenmalige toepassing op een reis of offerte.
- `/agency-admin/forms`: veilige klantintakes met configureerbare velden, vervallende links, review, audit en bewaartermijnen.
- `/agency-admin/notifications`: persoonlijke Agency-meldingsvoorkeuren.
- `/agency-admin/security`: teamstatus, verlopen uitnodigingen en recente veiligheidsrelevante activiteit.
- `/agency-admin/subscription`: actief Agency-plan en werkelijke gebruiksaantallen zonder gesimuleerde facturen.
- `/agency-admin/audit`: onveranderbare beheerhistorie voor de Agency-eigenaar.
- `/client-portal`: afgeschermde klantweergave van uitsluitend expliciet gekoppelde reizen.

Agency-klanten zijn geen interne workspaceleden. Zij zien uitsluitend reizen waaraan hun profiel of geaccepteerde uitnodiging expliciet is gekoppeld.

## Projectdocumentatie

- `IMPLEMENTATION_PENDING.md`: enige actuele uitrolroute voor de bestaande beta.
- `SERVER_OPERATIONS.md`: dagelijkse serverupdates, herstarts, logs en rollback.
- `MAIL_STATUS.md`: actuele scheiding tussen werkende productie-mail, lokaal gebouwde mailfuncties en resterende infrastructuur.
- `roadmap.md`: interne productstatus en volgorde.
- `BUILD_PLAN.md`: technische bouwvolgorde.
- `FEATURE_GAP_AND_EXPANSION.md`: concurrentiegaps en mogelijke uitbreidingen.
- `CHANGELOG.md`: technisch changelog voor GitHub en reviewers.
- `/roadmap`: publieke productroadmap.
- `/changelog`: publieke release notes.
- `/prijzen`: openbare vergelijking van Free, Pro en Agency; de beveiligde Paddle Checkout activeert betaalde rechten pas na een geverifieerd provider-event.
- `/privacy`, `/algemene-voorwaarden`, `/terugbetalingsbeleid` en `/beta-voorwaarden`: gepubliceerde privacy-, gebruiks-, terugbetalings- en betavoorwaarden in NL/EN.

## Productie

De TanStack Start-app draait als Node/Nitro-container op Node-01. Achtergrondtaken en de SMTP-relay draaien afgescheiden op Node-02. Supabase verzorgt database, authenticatie en objectopslag in Central EU (Frankfurt). Zie `SERVER_OPERATIONS.md` voor beheer, updates en herstel.
