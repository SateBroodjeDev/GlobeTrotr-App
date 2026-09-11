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
- Supabase Auth, PostgreSQL, Row Level Security en Storage
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

## Databasewijzigingen

Migraties staan chronologisch in `supabase/migrations` en worden in bestandsvolgorde uitgevoerd. Recente onderdelen omvatten versiegestuurde reisopslag, financiële privacy, publieke reis-RPC's, uitnodigingsbeheer, meldingen, Agency-workspaces, klantprofielen en gescheiden auditregistratie voor Corporate en Agency Admin.

De nog te implementeren Agency-uitbreidingen worden strikt in deze volgorde toegepast:

1. `20260908030000_agency_workspace_members.sql` t/m `20260908034000_trip_branding_overrides.sql`;
2. `20260908035000_agency_clients.sql`;
3. `20260908036000_agency_audit_log.sql`;
4. `20260908037000_fix_agency_clients_and_operations.sql`;
5. `20260908038000_agency_notification_preferences.sql`;
6. `20260908039000_secure_trip_documents.sql` en `20260908040000_trip_document_expiry.sql`;
7. `20260908041000_agency_tasks.sql` en `20260908042000_agency_templates.sql`;
8. `20260908043000_agency_quotes.sql`, `20260908044000_agency_quote_management.sql`, `20260908045000_secure_agency_quote_sharing.sql`, `20260908046000_agency_quote_responses.sql`, `20260908047000_convert_agency_quotes.sql`, `20260908048000_manage_agency_quote_shares.sql`, `20260908049000_agency_access_notifications.sql`, `20260908050000_agency_branding_notifications.sql`, `20260908051000_agency_task_notifications.sql`, `20260908052000_trip_document_notifications.sql`, `20260908053000_agency_client_notifications.sql` en `20260908054000_agency_quote_lifecycle.sql`.

De bijbehorende SQL-tests staan in `supabase/tests` en noemen bovenaan welke migratie eerst vereist is.

### Agency Admin

- `/agency-admin`: workspaceoverzicht en teambeheer.
- `/agency-admin/settings`: organisatiegegevens, standaardtaal, valuta, tijdzone, domein, accentkleur en logo.
- `/agency-admin/permissions`: standaardrechten per rol en persoonlijke uitzonderingen.
- `/agency-admin/clients`: klantprofielen en gekoppelde reizen. Een bestaand account met hetzelfde e-mailadres krijgt automatisch de rol `client` op die reizen; archiveren trekt deze automatische toegang in en herstellen bouwt haar opnieuw op. Voor een nieuw account blijft een uitnodiging nodig.
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
- `CHANGELOG.md`: technisch changelog voor GitHub en reviewers.
- `/roadmap`: publieke productroadmap.
- `/changelog`: publieke release notes.
- `/prijzen`: openbare vergelijking van Free, Pro en Agency; de betaalde tarieven zijn tijdens de gratis beta nog niet actief.
- `/privacy`, `/algemene-voorwaarden`, `/terugbetalingsbeleid` en `/beta-voorwaarden`: gepubliceerde privacy-, gebruiks-, terugbetalings- en betavoorwaarden in NL/EN.

## Lovable

Dit is een bestaand [Lovable](https://lovable.dev)-project. Commits op de gekoppelde branch synchroniseren terug naar Lovable. Herschrijf gepubliceerde Git-geschiedenis daarom niet met force-push, rebase of amend.
