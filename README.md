# GlobeTrotr

GlobeTrotr is een meertalige reisplanner voor individuen, groepen en reisorganisaties. De applicatie combineert routes, planning, boekingen, uitgaven, kostenverdeling, paklijsten, openbare reisverhalen en samenwerking in één workspace.

De huidige versie is een internationale beta. Inloggen met e-mail en wachtwoord werkt. OAuth en automatische app-e-mails staan bewust nog niet aan. Voor productie is Paddle de gekozen Merchant of Record voor abonnementen; de applicatieserver verhuist later van Lovable naar een eigen VPS en transactionele e-mail gaat dan via een afzonderlijke SMTP-provider.

## Wat de applicatie bevat

- Meerdere reizen met sjablonen, data, bestemmingen en een interactieve OpenStreetMap-route.
- Chronologisch reisschema, boekingen, vluchtinformatie, vervoer en paklijsten.
- Uitgaven in meerdere valuta, live ECB-koersen, slimme verrekening en veilige CSV/PDF-export.
- Brandstofprognoses per vervoerstype en koppeling met werkelijke tankuitgaven.
- Beveiligde samenwerking per reis met rollen, uitnodigingslink, accountmelding, accepteren, weigeren, vernieuwen en intrekken.
- Openbare reispagina's met kaart, planning, optioneel gedeelde boekingen, PIN-bescherming en weer.
- JSON-back-up per reis, volledige workspaceback-up, veilige import en AVG-gegevensexport.
- Persistente meldingen, platformstatusbanners, feedback en een publieke lijst met bekende problemen.
- Een afzonderlijke Agency Admin met organisatie-instellingen, private logo-opslag, centrale en per-reisbranding, interne teamrollen, persoonlijke rechten, klantprofielen, operationele werkvoorraad en append-only auditlog.
- Afgeschermd Corporate Admin-dashboard voor gebruikers, platformstatus, feedback, problemen en auditlog.

## Techniek

- React 19 en TypeScript
- TanStack Router, Start en React Query
- Vite 8 en Nitro met Cloudflare-build
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

`npm run check` voert de regressietests en de volledige client-, SSR- en Cloudflare-productiebuild uit. GitHub Actions voert dezelfde scriptset uit en installeert dependencies reproduceerbaar vanuit `bun.lock`.

Database-regressietests staan in `supabase/tests`. Voer ze in de Supabase SQL Editor uit nadat de genoemde migratie is toegepast. Iedere test draait in een transactie en eindigt met `ROLLBACK`.

Voor een volledige handmatige betacontrole staat een compacte afvinklijst in [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md).

## Databasewijzigingen

Migraties staan chronologisch in `supabase/migrations` en worden in bestandsvolgorde uitgevoerd. Recente onderdelen omvatten versiegestuurde reisopslag, financiële privacy, publieke reis-RPC's, uitnodigingsbeheer, meldingen, Agency-workspaces, klantprofielen en gescheiden auditregistratie voor Corporate en Agency Admin.

De Agency-basis tot en met `20260908057000_important_trip_notifications.sql` is toegepast. De laatste implementatiereeks (`580` tot en met `700`), bijbehorende tests en releasepoort staan in [`AGENCY_IMPLEMENTATION.md`](AGENCY_IMPLEMENTATION.md).

De beoogde productieopzet gebruikt één Hetzner-VPS voor de webapp en proxy en een tweede voor workers, geplande taken en e-mail. Supabase blijft aanvankelijk de beheerde database, Auth- en Storage-laag. [`STORAGE_ARCHITECTURE.md`](STORAGE_ARCHITECTURE.md) beschrijft hoe bestanden later zonder publieke buckets of padgebonden autorisatie naar Hetzner Object Storage kunnen worden verplaatst.

De eerste productiecontainer staat in `Dockerfile`; `compose.production.yml` definieert afzonderlijke web- en workerservices. De workerhandleiding en vereiste omgevingsvariabelen staan in [`worker/README.md`](worker/README.md). De worker blijft vóór de VPS-implementatie buiten gebruik en e-mail blijft standaard vastgehouden in testmodus.

De bijbehorende SQL-tests staan in `supabase/tests` en noemen bovenaan welke migratie eerst vereist is.

### Agency Admin

- `/agency-admin`: workspaceoverzicht en teambeheer.
- `/agency-admin/settings`: organisatiegegevens, standaardtaal, valuta, tijdzone, domein, accentkleur en logo.
- `/agency-admin/permissions`: standaardrechten per rol en persoonlijke uitzonderingen.
- `/agency-admin/clients`: klantprofielen en gekoppelde reizen. Een bestaand account met hetzelfde e-mailadres krijgt automatisch de rol `client` op die reizen; archiveren trekt deze automatische toegang in en herstellen bouwt haar opnieuw op. Voor een nieuw account blijft een uitnodiging nodig.
- `/agency-admin/suppliers`: herbruikbare accommodaties, vervoerders en activiteiten met contactgegevens, afspraken, commissie, archief en reiskoppelingen.
- `/contact`: publiek contactformulier met Cloudflare Turnstile; bevoegde medewerkers behandelen berichten via `/corporate-admin/contact`.
- `/agency-admin/operations`: portfolio, kosten en concrete aandachtspunten uit relationele reisdata.
- `/agency-admin/quotes`: interne offertes met klant, optionele reis, geldigheid en meerdere prijsvarianten.
- `/agency-admin/quotes/:quoteId/convert`: controlepagina om een geaccepteerde offerte aan een bestaande reis te koppelen of als nieuwe privéreis aan te maken.
- `/quote/:token`: tijdelijke, beveiligde klantweergave van een deelklare Agency-offerte.
- `/agency-admin/tasks`: taken, prioriteiten, deadlines en toewijzingen aan teamleden.
- `/agency-admin/templates`: herbruikbare programma's, paklijsten en klantteksten.
- `/agency-admin/notifications`: persoonlijke Agency-meldingsvoorkeuren.
- `/agency-admin/security`: teamstatus, verlopen uitnodigingen en recente veiligheidsrelevante activiteit.
- `/agency-admin/subscription`: actief Agency-plan en werkelijke gebruiksaantallen zonder gesimuleerde facturen.
- `/agency-admin/audit`: onveranderbare beheerhistorie voor de Agency-eigenaar.
- `/client-portal`: afgeschermde klantweergave van uitsluitend expliciet gekoppelde reizen.

Agency-klanten zijn geen interne workspaceleden. Zij zien uitsluitend reizen waaraan hun profiel of geaccepteerde uitnodiging expliciet is gekoppeld.

## Projectdocumentatie

- `roadmap.md`: interne technische roadmap en migratiestatus.
- `AGENCY_IMPLEMENTATION.md`: vaste uitvoervolgorde en releasepoort voor de Agency-implementatie.
- `CHANGELOG.md`: technisch changelog voor GitHub en reviewers.
- `/roadmap`: publieke productroadmap.
- `/changelog`: publieke release notes.
- `/prijzen`: openbare vergelijking van Free, Pro en Agency; de betaalde tarieven zijn tijdens de gratis beta nog niet actief.
- `/privacy`, `/algemene-voorwaarden`, `/terugbetalingsbeleid` en `/beta-voorwaarden`: gepubliceerde privacy-, gebruiks-, terugbetalings- en betavoorwaarden in NL/EN.

## Lovable

Dit is een bestaand [Lovable](https://lovable.dev)-project. Commits op de gekoppelde branch synchroniseren terug naar Lovable. Herschrijf gepubliceerde Git-geschiedenis daarom niet met force-push, rebase of amend.
