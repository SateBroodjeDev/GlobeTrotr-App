# GlobeTrotr

De gecontroleerde uitrol van de eigen SMTP/IMAP-server en automatische mailboxprovisioning staat in [MAIL_SERVER_DEPLOYMENT.md](MAIL_SERVER_DEPLOYMENT.md). Wijzig MX-records pas nadat de volledige acceptatietest daarin is geslaagd.

Voor de bestaande productie-beta gebruik je [de actuele uitrol](IMPLEMENTATION_PENDING.md) en [de publieke vrijgavecontrole](PRE_RELEASE.md). [SUPABASE_PRODUCTION_MIGRATION.md](SUPABASE_PRODUCTION_MIGRATION.md) is alleen voor een volledig nieuw, leeg Supabase-project.

GlobeTrotr is een meertalige reisplanner voor individuen, groepen en reisorganisaties. De applicatie combineert routes, planning, boekingen, uitgaven, kostenverdeling, paklijsten, openbare reisverhalen en samenwerking in één workspace.

De huidige versie draait als internationale beta op eigen GlobeTrotr-infrastructuur. E-mail/wachtwoord, passkey, Google en Discord zijn aangesloten. Transactionele e-mail loopt via de afgeschermde mailrelay. Paddle is live gekoppeld, maar betaalverwerking en de overige [open beta-incidenten](IMPLEMENTATION_PENDING.md#fase-7--vrijgavebesluit) worden nog met echte accounts gecontroleerd.

## Wat de applicatie bevat

- Meerdere reizen met sjablonen, data, bestemmingen en een interactieve OpenStreetMap-route.
- Chronologisch reisschema, boekingen, vluchtinformatie, vervoer en paklijsten.
- Uitgaven in meerdere valuta, live ECB-koersen, slimme verrekening en veilige CSV/PDF-export.
- Brandstofprognoses per vervoerstype en koppeling met werkelijke tankuitgaven.
- Beveiligde samenwerking per reis met rollen, uitnodigingslink, accountmelding, accepteren, weigeren, vernieuwen en intrekken.
- Openbare reispagina's met kaart, planning, optioneel gedeelde boekingen, PIN-bescherming en weer.
- JSON-back-up per reis, volledige workspaceback-up, veilige import en AVG-gegevensexport.
- Agenda-export van dagplanning en boekingen naar gangbare agenda-apps.
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

`npm run verify` voert ESLint, 85 regressietests, de volledige TypeScript-controle, de beveiligingsaudit, de release-preflight en syntaxiscontroles van de workers uit. De beveiligingsaudit blokkeert onbeveiligd service-rolegebruik, browserreferenties naar servergeheimen, nieuwe niet-beoordeelde HTML-sinks, onveilige externe links, gevoelige logging en nieuwe `SECURITY DEFINER`-functies zonder vastgezet zoekpad. De preflight controleert onder meer de migratie/testvolgorde, verwijderde handleidingen en kapotte UTF-8-tekst. `npm run check` voert daarna ook de productiebuild uit. De lockfile is `package-lock.json`. De Nitro-build kan lokaal op Windows tijdens de laatste bestandstrace door bestandstoegang (`EPERM`) stranden; de Linux-build in CI en op Node-01 is daarom de beslissende productiecontrole.

Database-regressietests staan in `supabase/tests`. Voer ze in de Supabase SQL Editor uit nadat de genoemde migratie is toegepast. Sommige zijn alleen-lezen, andere draaien in een transactie met `ROLLBACK`; controleer de kop van ieder bestand.

Voor een volledige handmatige betacontrole staat een compacte afvinklijst in [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md).

## Databasewijzigingen

Migraties staan chronologisch in `supabase/migrations` en worden in bestandsvolgorde uitgevoerd. Recente onderdelen omvatten versiegestuurde reisopslag, financiële privacy, publieke reis-RPC's, uitnodigingsbeheer, meldingen, Agency-workspaces, klantprofielen en gescheiden auditregistratie voor Corporate en Agency Admin.

Volgens de eigenaar zijn de SQL-migraties en tests tot en met **1630** uitgevoerd. Agency-klantformulieren, eigen mailhosting, maildiagnose, boekingsmailconcepten, Agency-content, webpush, automatische vluchtcontrole en het expliciete offline dagoverzicht zijn voorbereid als update 1.1; web-, worker- en productieacceptatie staan nog open. Zie [de actuele uitrol](IMPLEMENTATION_PENDING.md), de [portalomschakeling](PORTAL_DOMAIN_MIGRATION.md), de [publieke vrijgavecontrole](PRE_RELEASE.md), de [productcontrole](PRODUCT_REVIEW_2026-09-22.md), de [functie-gapanalyse](FEATURE_GAP_AND_EXPANSION.md) en het concrete [bouwplan](BUILD_PLAN.md).

De productie-beta gebruikt één Hetzner-VPS voor webapp en Caddy en een tweede voor worker, mailrelay en IMAP-sync. Supabase is de beheerde database-, Auth- en Storage-laag in Central EU (Frankfurt, `eu-central-1`). [`STORAGE_ARCHITECTURE.md`](STORAGE_ARCHITECTURE.md) beschrijft een mogelijke latere verplaatsing naar Hetzner Object Storage.

De productiecontainers gebruiken `Dockerfile`, `deploy/web.compose.yml` en `deploy/worker.compose.yml`. De worker en mailrelay draaien op Node-02. De actuele e-mailmodus staat in Supabase `email_delivery_config`; ga niet uit van testmodus. Zie [`worker/README.md`](worker/README.md).

De bestaande productie-beta verstuurt en ontvangt mail via ZXCS. Eigen Stalwart-hosting en boekingsmail per reis zijn lokaal gebouwd en wachten op migraties 1560–1580, Node-02-configuratie en productieacceptatie. [MAIL_STATUS.md](MAIL_STATUS.md) geeft per onderdeel exact aan wat nu werkt en wat nog moet gebeuren.

De concrete installatie voor `GBT-Node-01` en `GBT-Node-02`, inclusief Caddy,
HTTPS, omgevingsvariabelen, healthchecks en rollback, staat in
[`VPS_DEPLOYMENT.md`](VPS_DEPLOYMENT.md).

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
- `MAIL_STATUS.md`: actuele scheiding tussen werkende productie-mail, lokaal gebouwde mailfuncties en resterende infrastructuur.
- `roadmap.md`: interne technische roadmap en migratiestatus.
- `CHANGELOG.md`: technisch changelog voor GitHub en reviewers.
- `/roadmap`: publieke productroadmap.
- `/changelog`: publieke release notes.
- `/prijzen`: openbare vergelijking van Free, Pro en Agency; de beveiligde Paddle Checkout activeert betaalde rechten pas na een geverifieerd provider-event.
- `/privacy`, `/algemene-voorwaarden`, `/terugbetalingsbeleid` en `/beta-voorwaarden`: gepubliceerde privacy-, gebruiks-, terugbetalings- en betavoorwaarden in NL/EN.

## Productie

De TanStack Start-app draait als Node/Nitro-container op Node-01. Achtergrondtaken en de SMTP-relay draaien afgescheiden op Node-02. Supabase verzorgt de Europese database, authenticatie en objectopslag. Zie `VPS_DEPLOYMENT.md` voor beheer, updates en herstel.
