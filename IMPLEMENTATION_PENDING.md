# GlobeTrotr — actueel implementatiehandboek

**Stand: 23 september 2026**

**Uitrolstatus:** update 1.1 is op Node-01 en Node-02 uitgerold. De onderstaande update 1.2 staat lokaal klaar, maar is nog niet gecommit of uitgerold. De eigen mailserver blijft een afzonderlijke, uitgestelde migratie.

<!-- release-preflight: confirmed-through=20260908164000_gpx_import_acceptance.sql -->

## Aanvulling update 1.2 — hotelfinder

Migratie en test 1640 zijn al uitgevoerd. Voer voor de hotelfinder in de Supabase SQL Editor nu eerst [20260908165000_hotel_gap_discovery_acceptance.sql](supabase/migrations/20260908165000_hotel_gap_discovery_acceptance.sql) en daarna [hotel_gap_discovery_acceptance.sql](supabase/tests/hotel_gap_discovery_acceptance.sql) uit.

Zet op Node-01 in `.env.production`:

```dotenv
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

Node-02 verandert hiervoor niet. Bouw Node-01 opnieuw. Open daarna een reis met bestemmingen, aankomstdatums en nachten. Controleer onder **Vergelijker** dat ontbrekende hotelnachten verschijnen, zoek een hotel en voeg één resultaat toe aan de Vergelijker. De zoekactie gebruikt OpenStreetMap; live prijzen en beschikbaarheid moeten bij de aanbieder worden gecontroleerd.

## Eerstvolgende uitrol: update 1.2

Update 1.2 bevat GPX-import en de tijdelijke productieschakelaar voor boekingsmail. Reguliere accountmail, transactionele mail en bedrijfsmail blijven via ZXCS werken. Alleen het automatisch aanmaken en verwerken van `trip.*@globetrotr.nl` blijft verborgen totdat Hetzner poort 25 heeft vrijgegeven en Stalwart volledig is getest.

### A. Voor de commit op de eigen pc

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
npm ci
npm run verify
npm run build
git -c core.safecrlf=false diff --check
git status --short
```

Commit en push pas wanneer alle opdrachten slagen. Gebruik geen force-push en herschrijf geen bestaande Lovable-commits.

### B. Supabase — afgerond

Migratie `20260908164000_gpx_import_acceptance.sql` en test `gpx_import_acceptance.sql` zijn op 23 september 2026 uitgevoerd. Voer deze bij deze uitrol niet opnieuw uit.

### C. Alleen Node-01 bijwerken

Deze wijziging bevat geen nieuwe worker- of Node-02-runtimecode. Node-02 hoeft hiervoor niet opnieuw gebouwd te worden.

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only origin lovable
nano .env.production
```

Zorg dat deze regel aanwezig is:

```dotenv
TRIP_BOOKING_MAIL_ENABLED=false
```

Sla op met `Ctrl+O`, Enter en sluit met `Ctrl+X`. Bouw daarna het web opnieuw:

```bash
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=150 web caddy
```

### D. Update 1.2 accepteren

1. Open een bewerkbare reis en kies **GPX importeren**.
2. Test een waypoint, routepunt en trackpunt en controleer de volgorde.
3. Controleer dat een bestaand coördinaat als dubbel wordt gemarkeerd en niet geselecteerd is.
4. Controleer selectie en scrollen op 320, 375 en 430 px breedte.
5. Controleer dat een bestand groter dan 2 MB en een bestand met meer dan 500 geldige punten wordt geweigerd.
6. Open **Boekingen per e-mail** en controleer de tijdelijke melding zonder aanmaakknop.
7. Test één gewone accountmail en één bedrijfsmail om te bevestigen dat ZXCS actief is gebleven.

De rest van dit document bewaart de afgeronde update 1.1-uitrol en de nog uit te voeren productieacceptatie.

Deze handleiding rolt releasecommit `9a67ef0` op branch `lovable` uit. SQL-migraties en tests tot en met **1630** zijn uitgevoerd. Voer geen SQL opnieuw uit. Rol eerst de applicatie uit. De eigen Stalwart-mailserver en MX-overgang zijn een afzonderlijke tweede fase.

## Vooraf gereedmaken

Genereer op je eigen pc één VAPID-sleutelpaar en bewaar beide waarden in je wachtwoordmanager:

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
npx web-push generate-vapid-keys
```

Gebruik op beide nodes exact dezelfde public key. Alleen Node-02 krijgt de private key. Commit nooit `.env`, `.env.production`, `.env.mail-relay`, wachtwoorden of tokens.

## 1. De bestaande releasecommit controleren en pushen — afgerond

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git branch --show-current
git status --short
npm ci
npm run verify
npm run build
git -c core.safecrlf=false diff --check
git log -1 --oneline
git push origin lovable
git rev-parse --short HEAD
```

De branch moet `lovable` zijn en `git status --short` moet leeg blijven. Noteer de laatste uitvoer als `VERWACHTE_COMMIT`. Stop bij een test-, build- of diff-fout.

## 2. Node-01 configureren — afgerond

Log in op Node-01 en controleer eerst dat de checkout schoon is:

```bash
cd /opt/globetrotr
git status --short
nano .env.production
```

Voeg toe of werk bij:

```dotenv
VAPID_SUBJECT=mailto:info@globetrotr.nl
VAPID_PUBLIC_KEY=PLAK_HIER_DE_PUBLIC_KEY
```

Sla in nano op met `Ctrl+O`, Enter en sluit met `Ctrl+X`. Voeg `MAIL_SERVER_HEALTH_URL` pas toe wanneer fase 7, de eigen mailserver, is voltooid.

## 3. Node-02 configureren — afgerond

```bash
cd /opt/globetrotr
git status --short
nano .env.production
```

Voeg toe of werk bij:

```dotenv
VAPID_SUBJECT=mailto:info@globetrotr.nl
VAPID_PUBLIC_KEY=DEZELFDE_PUBLIC_KEY_ALS_NODE_01
VAPID_PRIVATE_KEY=PLAK_HIER_DE_PRIVATE_KEY
```

Controleer dat de al bestaande waarden voor Supabase, relay, IMAP, Paddle, mailboxencryptie en vluchtprovider intact blijven. Sluit met `Ctrl+O`, Enter en `Ctrl+X`.

## 4. Node-02 worker uitrollen — afgerond

Deze fase start nog geen Stalwart-server en wijzigt geen MX-record.

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only origin lovable
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/worker.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build --force-recreate clamav mail-relay worker imap-sync
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=150 clamav mail-relay worker imap-sync
docker compose --env-file .env.production -f deploy/worker.compose.yml exec worker node -e "fetch('http://127.0.0.1:9091/health').then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.error(e);process.exit(1)})"
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.error(e);process.exit(1)})"
```

De commit moet gelijk zijn aan `VERWACHTE_COMMIT`. `worker`, `imap-sync`, `mail-relay` en `clamav` moeten actief zijn; worker en relay moeten HTTP 200 geven.

## 5. Node-01 web uitrollen — afgerond

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only origin lovable
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml run --rm --no-deps --entrypoint caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=150 web caddy
```

Controleer ook hier dat `git rev-parse --short HEAD` gelijk is aan `VERWACHTE_COMMIT`.

## 6. Technische controle en acceptatie — nu uitvoeren

Vanaf je pc:

```powershell
curl.exe -I https://globetrotr.nl/
curl.exe -I https://portal.globetrotr.nl/
curl.exe -I https://portal.globetrotr.nl/auth
curl.exe -I https://portal.globetrotr.nl/register
curl.exe -I https://portal.globetrotr.nl/features
curl.exe -I https://globetrotr.nl/account
curl.exe -I https://portal.globetrotr.nl/offline.html
```

Verwacht website `200`, portal-root een redirect naar `/dashboard`, auth/register `200`, portal-features een redirect naar de website, website-account een redirect naar het portal en `offline.html` `200`. Het portal moet `X-Robots-Tag: noindex, nofollow` houden.

Voer daarna in deze volgorde de praktijktest uit:

1. Registreer een testaccount en controleer bevestiging, recovery, magic link, Google, Discord, passkey en TOTP.
2. Controleer website ↔ portal, mobiele navigatie op 320/375/430 px en Agency-host/CNAME-toegang.
3. Test de Reisvergelijker, reacties, peiling, deadline, stem wijzigen en precies één definitieve boeking.
4. Test een NL- en EN-Agency-klantformulier, intrekken, eenmalig indienen, review, export, archiveren en tenantisolatie.
5. Test de contentbibliotheek met rollen, versie, bron/licentie en precies één toepassing op reis en offerte.
6. Activeer browserpush, ontvang een melding met gesloten tabblad, trek het apparaat in en controleer dat geen reisdetails in de push staan.
7. Test vluchtcontrole op Pro/Agency: eerste basislijn zonder melding, geen melding bij ongewijzigd resultaat en precies één melding bij status-, tijd-, gate- of terminalwijziging.
8. Bewaar een reis offline, open meerdere dagen in vliegtuigmodus, voeg een uitgave toe, herstel internet en synchroniseer precies eenmaal. Controleer dat uitloggen pakket en wachtrij wist.
9. Test bedrijfsmail, HTML, handtekening, bijlagen, inline/externe afbeeldingen, retry en boekingsmailconcept met deduplicatie.
10. Test Paddle terugkerend en losse maand inclusief webhook, factuur, recht, einddatum en meldingstaal.

Gebruik [TEST_CHECKLIST.md](TEST_CHECKLIST.md) voor de volledige lijst. Rond Corporate Admin-items pas af na de bijbehorende echte proef.

## 7. Eigen mailserver afzonderlijk invoeren

Begin hier pas nadat stappen 1–6 stabiel zijn. Volg [MAIL_SERVER_DEPLOYMENT.md](MAIL_SERVER_DEPLOYMENT.md) letterlijk voor Stalwart, PTR, poorten, beperkte API-key, mailboxmigratie, SPF, DKIM, DMARC, back-up/herstel en terugval.

Wijzig het MX-record uitsluitend nadat inkomend en uitgaand mailverkeer via een testpostvak, boekingsmail, malwarecontrole, externe afleverproeven en een volledige hersteltest zijn geslaagd. Tot dat moment blijft ZXCS actief. De actuele grens staat in [MAIL_STATUS.md](MAIL_STATUS.md).

## Terugval

Herschrijf de Lovable-Gitgeschiedenis nooit. Als de applicatie-uitrol moet worden teruggedraaid:

```powershell
git revert RELEASE_COMMIT_HASH
git push origin lovable
```

Trek daarna de herstelcommit op Node-02 en Node-01 binnen en voer respectievelijk stap 4 en stap 5 opnieuw uit. Bij mailproblemen blijft of wordt ZXCS opnieuw actief volgens de terugvalstappen in [MAIL_SERVER_DEPLOYMENT.md](MAIL_SERVER_DEPLOYMENT.md). Verwijder geen mailvolumes of accounts.
