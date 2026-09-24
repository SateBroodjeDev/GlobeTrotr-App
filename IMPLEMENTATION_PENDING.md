# Uitrolhandboek beta 0.9 naar release 1.0

## Paddle: goedgekeurd hoofddomein gebruiken

`globetrotr.nl` is al door Paddle goedgekeurd. De applicatie gebruikt daarom een checkoutbrug op `https://globetrotr.nl/paddle-checkout`; `portal.globetrotr.nl` hoeft niet afzonderlijk goedgekeurd te zijn om deze checkout te openen.

1. Laat `globetrotr.nl` in het **live** Paddle-dashboard onder **Checkout → Website approval** op **Approved** staan.
2. Rol de nieuwe webversie uit op Node-01. Er is geen extra DNS- of Caddy-regel nodig.
3. Start een aankoop op `https://portal.globetrotr.nl/billing`.
4. De browser opent de checkout op het goedgekeurde hoofddomein en keert na betaling terug naar `https://portal.globetrotr.nl/billing?checkout=success`.
5. Controleer eenmalig een maandbetaling en een eenmalige betaling.

De ondertekende checkoutkoppeling staat alleen in het URL-fragment en wordt daardoor niet naar de webserver of in de referrer meegestuurd. Laat de bestaande Paddle-webhook ongewijzigd.

**Stand: 24 september 2026 · geplande release: 1 oktober 2026**

Dit is de enige handleiding voor deze uitrol. Algemeen serverbeheer staat in `SERVER_OPERATIONS.md`; herhaal die commando’s hier niet vanuit andere documenten. Migraties en tests tot en met **1720** zijn volgens de eigenaar uitgevoerd.

<!-- release-preflight: confirmed-through=20260908169000_trip_date_shift_acceptance.sql -->

## 1. Vooraf op je eigen pc

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git status --short
npm run verify
npm run build
```

Maak voor webpush eenmalig één sleutelpaar wanneer dat nog niet bestaat:

```powershell
npx web-push generate-vapid-keys
```

Bewaar beide sleutels in je wachtwoordmanager. Commit ze nooit en genereer later geen nieuw paar zonder alle apparaten opnieuw aan te melden.

## 2. Supabase SQL Editor — afgerond

De volgende migraties en tests zijn op 24 september 2026 uitgevoerd:

1. `supabase/migrations/20260908170000_confirmed_payment_notifications.sql`
2. `supabase/tests/confirmed_payment_notifications.sql`
3. `supabase/migrations/20260908171000_self_hosted_agency_licensing.sql`
4. `supabase/tests/self_hosted_agency_licensing.sql`
5. `supabase/migrations/20260908172000_notification_link_compatibility.sql`
6. `supabase/tests/notification_link_compatibility.sql`

Migratie 1710 zet de publieke verkoop nadrukkelijk **niet** aan. Zij bereidt alleen de afgeschermde licentiedatabase en Corporate Admin voor. Herhaal deze SQL-bestanden tijdens deze uitrol niet. De volgende stap is de code committen en daarna Node-01 en Node-02 bijwerken.

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

Controleer vervolgens zonder de sleutel af te drukken:

```bash
docker compose --env-file .env.production -f deploy/web.compose.yml exec web node -e "console.log({subject:Boolean(process.env.VAPID_SUBJECT),publicKey:Boolean(process.env.VAPID_PUBLIC_KEY)})"
```

Beide waarden moeten `true` zijn.

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

Controleer daarna de pushworker vanuit de container, zodat dit ook werkt als poort 9091 alleen aan het private adres is gekoppeld:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml exec worker node -e "fetch('http://127.0.0.1:9091/health/push').then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)})"
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker
```

De healthcheck moet `"status":"configured"` tonen. Een firewallwijziging is niet nodig: de worker maakt zelf uitgaande HTTPS-verbindingen met de pushdienst van de browser.

Start of actualiseer daarna de interne vertaalservice op Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d translation
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation ps
curl -fsS http://10.0.0.3:5000/languages
```

De translation-container accepteert maximaal 30.000 tekens per aanvraag. Dit
is bewust gelijk aan de limiet voor ontvangen bedrijfsmail, omdat HTML-opmaak
aanzienlijk groter kan zijn dan de zichtbare tekst. Herbouw de
translation-container na een wijziging aan `deploy/worker.compose.yml`.

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

- open rechtsboven **Meldingen** en kies **Push op dit apparaat aanzetten**;
- controleer dat daarna **Testmelding versturen** verschijnt;
- sluit het GlobeTrotr-tabblad en verstuur de testmelding;
- ontvang de algemene push en open via die push opnieuw GlobeTrotr;
- controleer op Node-02 dat de worker geen `WEB_PUSH_*`-fout logt;
- trek toestemming in en controleer dat een verlopen endpoint wordt ingetrokken.

## Meldingenaudit voor deze release

| Bron                                               |                       In-app | Webpush |                             E-mail | Uitkomst van de controle                                                                                     |
| -------------------------------------------------- | ---------------------------: | ------: | ---------------------------------: | ------------------------------------------------------------------------------------------------------------ |
| Account, plan en Paddle                            |                           ja |      ja | belangrijke account- en betaalmail | Checkout openen meldt geen betaling meer; alleen afgerond, mislukt en achterstallig zijn definitief.         |
| Reiswijzigingen, boekingen, uitgaven en documenten |                           ja |      ja |    volgens voorkeur en gebeurtenis | Reisvoorkeuren worden vóór het aanmaken toegepast. Boekingsmail gebruikt nu het geldige type `trip_booking`. |
| Uitnodigingen en toegang                           |                           ja |      ja |      ja, eenmalig per geldige link | De in-appmelding maakt geen tweede uitnodigingsmail.                                                         |
| Peilingen en deadlines                             |                           ja |      ja |              volgens `tripUpdates` | Alleen niet-stemmers krijgen één deadlineherinnering.                                                        |
| Vluchtwijzigingen                                  |                           ja |      ja |                                nee | Alleen status, tijd, gate en terminal worden begrensd gemeld; voorkeur per reis wordt gerespecteerd.         |
| Platformstatus en kritieke storing                 |                           ja |      ja |                                 ja | NL/EN wordt op profieltaal gekozen; push toont bewust geen incidentdetails.                                  |
| Contact en nieuwe bedrijfsmail                     | ja voor beheerders/eigenaren |      ja |                                nee | Ontvangers worden direct via realtime en push gewaarschuwd.                                                  |
| Privacyverzoek en antwoord                         |                           ja |      ja |           antwoord als accountmail | Nieuw verzoek waarschuwt Corporate Admin; antwoord waarschuwt de aanvrager.                                  |
| Agency-taak, offerte, toegang en klant             |                           ja |      ja |    alleen waar functioneel vereist | Een ingevuld klantformulier waarschuwt nu eigenaar en bevoegde teamleden.                                    |

Webpush bevat altijd alleen een algemene zin in één profieltaal. Onderwerp, reisnaam, e-mailadres en andere inhoud blijven achter de login in het meldingenpaneel. Iedere actieve browserinschrijving krijgt één outboxregel; mislukte bezorging probeert begrensd opnieuw en een verlopen browserendpoint wordt ingetrokken.

### Beheer en export

- verschuif een testreis eerst vooruit en daarna terug; controleer preview, periode, stops, dagplanning, boekingen en kandidaten;
- controleer dat uitgaven, `createdAt` en `checkedAt` niet mee verschuiven en dat een externe reservering niet als gewijzigd wordt voorgesteld;

- open Corporate en Agency Auditlog en controleer actor, doel, context en reden;
- download de JSON-accountexport en controleer de compacte samenvatting van weggedrukte meldingen;
- controleer GPX, eenmalige ICS, CSV, reisgids en PDF-declaratie vanuit Instellingen.

## 6. Vrijgavebesluit

Release 1.0 mag alleen worden gepubliceerd wanneer:

- alle drie nieuwe SQL-tests en de opnieuw uitgevoerde test van migratie 1700 slagen;
- alle vereiste containers gezond blijven;
- geen kritieke of hoge beveiligingsbevinding openstaat;
- de praktijktests hierboven slagen of een niet-kritieke afwijking zichtbaar is vastgelegd;
- ZXCS-mail, registratie en Paddle nog werken;
- privacy-, roadmap- en changelogteksten overeenkomen met de productie;
- de gebruikte Git-commit en uitroltijd zijn vastgelegd.

Bij een mislukte serveruitrol gebruik je de rollbackstappen uit `SERVER_OPERATIONS.md`. Databasewijzigingen herstel je uitsluitend met een nieuwe voorwaartse migratie.
