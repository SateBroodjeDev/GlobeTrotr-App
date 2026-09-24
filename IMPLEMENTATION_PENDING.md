# Uitrolhandboek beta 0.9 naar release 1.0

**Stand: 24 september 2026 · geplande release: 1 oktober 2026**

Dit is de enige handleiding voor deze uitrol. Algemeen serverbeheer staat in `SERVER_OPERATIONS.md`; herhaal die commando’s hier niet vanuit andere documenten. Migraties en tests tot en met **1650** zijn volgens de eigenaar uitgevoerd.

<!-- release-preflight: confirmed-through=20260908165000_hotel_gap_discovery_acceptance.sql -->

## 1. Vooraf op je eigen pc

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git status --short
npm run verify
npm run build
```

Maak voor webpush eenmalig sleutels wanneer die nog niet bestaan:

```powershell
npx web-push generate-vapid-keys
```

Bewaar beide sleutels in je wachtwoordmanager. Commit ze nooit.

## 2. Supabase SQL Editor

Voer exact in deze volgorde uit:

1. `supabase/migrations/20260908166000_trip_comparison_persistence.sql`
2. `supabase/tests/trip_comparison_persistence.sql`
3. `supabase/migrations/20260908167000_live_calendar_refresh.sql`
4. `supabase/tests/live_calendar_refresh.sql`
5. `supabase/migrations/20260908168000_corporate_mail_management_acceptance.sql`
6. `supabase/tests/corporate_mail_management_acceptance.sql`
7. `supabase/migrations/20260908169000_trip_date_shift_acceptance.sql`
8. `supabase/tests/trip_date_shift_acceptance.sql`

Iedere test moet zonder fout eindigen. Stop bij een fout en ga dan niet naar de servers.

## 3. Node-01 configuratie

Controleer in `/opt/globetrotr/.env.production`:

```dotenv
VAPID_SUBJECT=mailto:info@globetrotr.nl
VAPID_PUBLIC_KEY=DE_PUBLIC_KEY
TRIP_BOOKING_MAIL_ENABLED=false
TRANSLATION_API_URL=http://10.0.0.3:5000/translate
TRANSLATION_API_KEY=
```

Werk Node-01 daarna bij met de opdrachten onder **Node-01 bijwerken** in `SERVER_OPERATIONS.md`.

## 4. Node-02 configuratie

Controleer in `/opt/globetrotr/.env.production`:

```dotenv
VAPID_SUBJECT=mailto:info@globetrotr.nl
VAPID_PUBLIC_KEY=DEZELFDE_PUBLIC_KEY
VAPID_PRIVATE_KEY=DE_PRIVATE_KEY
TRIP_BOOKING_MAIL_ENABLED=false
TRANSLATION_BIND_ADDRESS=10.0.0.3
```

Werk Node-02 daarna bij met de opdrachten onder **Node-02 bijwerken** in `SERVER_OPERATIONS.md`.

Start of actualiseer daarna de interne vertaalservice op Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d translation
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation ps
curl -fsS http://10.0.0.3:5000/languages
```

TCP 5000 mag in de providerfirewall en UFW uitsluitend vanaf het private IP van Node-01 bereikbaar zijn. Publiceer deze poort niet op internet.

ZXCS blijft actief. Start Stalwart niet en wijzig MX, SPF, DKIM of DMARC niet tijdens deze release.

## 5. Verplichte praktijktests

### Reisvergelijker

- voeg minimaal twee kandidaten toe;
- herlaad: kandidaten blijven staan;
- plaats een reactie;
- start een peiling, stem, wijzig de stem en sluit de peiling;
- controleer dit met twee reisleden en de juiste rollen.

### Reis en mobiel

- controleer lange boekingsteksten op 320, 375 en 430 px;
- controleer Vandaag vóór, tijdens en na de reis;
- controleer de vertrekcheck met volledige en onvolledige gegevens;
- controleer dat alleen Offline en Agenda bovenaan staan en overige exports onder Instellingen.

### Offline

- bewaar een reis met planning en boekingen offline;
- controleer pakketgrootte, inhoud en synchronisatiestatus;
- schakel vliegtuigmodus in en open het offline dagoverzicht;
- controleer dat codes, documenten en bestaande bedragen ontbreken;
- zet internet aan en synchroniseer een nieuwe offline uitgave bewust.

### Live agenda

- maak één abonnementslink en voeg die aan een echte agenda-app toe;
- wijzig daarna titel of datum in GlobeTrotr zonder een nieuwe link te maken;
- controleer de wijziging na de volgende verversing van de agenda-app;
- controleer verblijf en huurauto als transparante hele-dagactiviteit.

GlobeTrotr geeft vijf minuten als verversingsvoorkeur mee. Google, Apple en Outlook bepalen zelf hun werkelijke ophaalinterval.

### Agency-domeinen

- open `https://AGENCY.globetrotr.nl/` en een geverifieerd eigen domein;
- controleer dat de hostnaam behouden blijft en alleen de juiste Agency zichtbaar is;
- test een directe beheer-URL en een account van een andere Agency;
- controleer de CNAME- en TXT-instructies in het DNS-venster.

### Account, betaling en communicatie

- registreer met e-mail en controleer bevestiging;
- test Google, Discord, passkey en TOTP;
- ontkoppel Google of Discord en controleer de status zonder opnieuw inloggen;
- voer een Paddle-testbetaling uit en controleer plan en factuur;
- dien een privacyverzoek in en behandel het in Corporate Admin;
- verstuur en ontvang account- en bedrijfsmail via ZXCS.
- archiveer minstens 26 bedrijfsmails en controleer **Meer laten zien**;
- open een HTML-mail schermvullend en sluit met de knop en met Escape;
- maak van een korte en een lange mail een NL- en EN-vertaalconcept;
- controleer dat alleen een beheerder een gearchiveerd bericht definitief kan verwijderen en dat herstel daarna onmogelijk is.

### Push

- registreer een browserapparaat;
- ontvang een melding met gesloten tabblad;
- trek toestemming in en controleer dat een verlopen endpoint wordt ingetrokken.

### Beheer en export

- verschuif een testreis eerst vooruit en daarna terug; controleer preview, periode, stops, dagplanning, boekingen en kandidaten;
- controleer dat uitgaven, `createdAt` en `checkedAt` niet mee verschuiven en dat een externe reservering niet als gewijzigd wordt voorgesteld;

- open Corporate en Agency Auditlog en controleer actor, doel, context en reden;
- download de JSON-accountexport en controleer de compacte samenvatting van weggedrukte meldingen;
- controleer GPX, eenmalige ICS, CSV, reisgids en PDF-declaratie vanuit Instellingen.

## 6. Vrijgavebesluit

Release 1.0 mag alleen worden gepubliceerd wanneer:

- alle vier SQL-tests slagen;
- alle vereiste containers gezond blijven;
- geen kritieke of hoge beveiligingsbevinding openstaat;
- de praktijktests hierboven slagen of een niet-kritieke afwijking zichtbaar is vastgelegd;
- ZXCS-mail, registratie en Paddle nog werken;
- privacy-, roadmap- en changelogteksten overeenkomen met de productie;
- de gebruikte Git-commit en uitroltijd zijn vastgelegd.

Bij een mislukte serveruitrol gebruik je de rollbackstappen uit `SERVER_OPERATIONS.md`. Databasewijzigingen herstel je uitsluitend met een nieuwe voorwaartse migratie.
