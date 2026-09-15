# Eén implementatiehandleiding voor GlobeTrotr

Deze handleiding begint bij de huidige situatie:

- de code staat op branch `lovable`;
- Node-01 (`2.28.36.231`) draait de website en Caddy;
- Node-02 (`178.105.243.191`) draait worker, mailrelay en IMAP-sync;
- het private adres van Node-02 is `10.0.0.3`;
- DNS, firewall, Supabase, SMTP en OAuth werken al;
- SQL tot en met migratie 1130 is uitgevoerd;
- migraties 1140, 1150 en 1160 moeten met deze uitrol worden toegepast.

Voer de stappen in deze volgorde uit. Bewaar echte keys uitsluitend in de
genoemde `.env`-bestanden op de servers. Plak ze nooit in Git, een issue of een
chatbericht.

## 1. Op je Windows-pc: controleren, committen en pushen

Open PowerShell in de projectmap:

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git branch --show-current
git status
npm test
git diff --check
```

De branch moet `lovable` zijn. Voeg daarna alles toe, controleer expliciet dat
`.env` niet wordt meegenomen en commit:

```powershell
git add -A
git status
git diff --cached --name-only
git commit -m "Complete production mail domains and Paddle billing"
git push origin lovable
```

Stop wanneer `.env`, `.env.production` of `.env.mail-relay` in de staged lijst
staat. Verwijder zo'n bestand dan eerst met `git restore --staged BESTANDSNAAM`.

## 2. In Supabase: SQL uitvoeren

Open Supabase Dashboard, kies het productieproject en open **SQL Editor**.
Open ieder bestand lokaal, kopieer de volledige inhoud naar een nieuwe query en
kies **Run**. Gebruik exact deze volgorde:

1. `supabase/migrations/20260908114000_notification_and_invitation_reliability.sql`
2. `supabase/tests/notification_and_invitation_reliability.sql`
3. `supabase/migrations/20260908115000_mailbox_credentials_and_agency_domains.sql`
4. `supabase/tests/mailbox_credentials_and_agency_domains.sql`
5. `supabase/migrations/20260908116000_paddle_billing_runtime.sql`
6. `supabase/tests/paddle_billing_runtime.sql`

De drie testbestanden eindigen met `ROLLBACK` en laten geen testdata achter. Ga
alleen verder als alle zes queries zonder foutmelding eindigen.

## 3. In Paddle Sandbox: producten en toegang maken

Volg voor de schermafbeeldingen en achtergrondinformatie
[`PADDLE_IMPLEMENTATION.md`](PADDLE_IMPLEMENTATION.md). De korte verplichte
volgorde is:

1. Schakel Paddle naar **Sandbox**.
2. Maak `GlobeTrotr Pro`, EUR 9,00 per maand.
3. Maak `GlobeTrotr Agency`, EUR 29,00 per maand.
4. Kopieer beide `pri_...` price-ID's.
5. Maak een Sandbox client-side token (`test_...`).
6. Maak een Sandbox API-key met toegang tot customer portal sessions,
   subscriptions, transactions en adjustments/refunds.
7. Maak onder **Developer tools > Notifications** deze destination:

   `https://globetrotr.nl/api/paddle/webhook`

8. Selecteer subscription-, transaction-, adjustment- en customer-events uit
   de Paddle-handleiding.
9. Kopieer het endpointsecret (`pdl_ntfset_...`).

Je hebt nu vijf waarden:

```text
PADDLE_CLIENT_TOKEN=test_...
PADDLE_PRO_PRICE_ID=pri_...
PADDLE_AGENCY_PRICE_ID=pri_...
PADDLE_API_KEY=pdl_sdbx_apikey_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
```

## 4. Een gedeelde mailboxencryptiesleutel maken

Open PowerShell en log in op Node-01:

```powershell
ssh globetrotr@2.28.36.231
```

Maak op Node-01 één sleutel:

```bash
openssl rand -base64 32
```

Kopieer de uitvoer tijdelijk naar je wachtwoordmanager. Exact dezelfde waarde
moet op beide nodes als `MAILBOX_CREDENTIALS_KEY` worden ingesteld. Verlies of
wijzig deze sleutel niet zolang versleutelde mailboxwachtwoorden bestaan.

## 5. Node-01: code en `.env.production` bijwerken

Je bent ingelogd als `globetrotr` op Node-01.

```bash
cd /opt/globetrotr
git status
git pull --ff-only origin lovable
cp .env.production .env.production.backup-before-1160
nano .env.production
```

Laat bestaande Supabase-, Turnstile-, GitHub- en providerwaarden staan. Voeg
deze regels toe of werk ze bij:

```dotenv
MAILBOX_CREDENTIALS_KEY=DE_GEDEELDE_BASE64_SLEUTEL
WORKER_HEALTH_URL=http://10.0.0.3:9091/health

VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_CLIENT_TOKEN=test_VUL_IN
VITE_PADDLE_PRO_MONTHLY_PRICE_ID=pri_VUL_PRO_IN
VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_VUL_AGENCY_IN
PADDLE_API_KEY=pdl_sdbx_apikey_VUL_IN
```

`PADDLE_WEBHOOK_SECRET` is niet nodig op Node-01. Sla nano op met `Ctrl+O`,
Enter en sluit met `Ctrl+X`. Controleer zonder waarden te tonen:

```bash
chmod 600 .env.production
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
```

Bouw en start daarna Node-01:

```bash
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web caddy
curl -fsSI https://globetrotr.nl
curl -fsSI https://www.globetrotr.nl
```

Beide containers moeten `Up` of `healthy` zijn. Verlaat Node-01:

```bash
exit
```

## 6. Node-02: code en `.env.production` bijwerken

Open vanaf je Windows-pc een nieuwe verbinding:

```powershell
ssh globetrotr@178.105.243.191
```

Voer op Node-02 uit:

```bash
cd /opt/globetrotr
git status
git pull --ff-only origin lovable
cp .env.production .env.production.backup-before-1160
cp .env.mail-relay .env.mail-relay.backup-before-1160
nano .env.production
```

Behoud alle bestaande Supabase-, worker-, relay- en IMAP-waarden. Controleer of
deze regels aanwezig en correct zijn:

```dotenv
SUPABASE_URL=https://mucvqudlzntywnyqucfo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=JOUW_BESTAANDE_SERVICE_ROLE_KEY

WORKER_POLL_MS=5000
WORKER_BATCH_SIZE=20
WORKER_HEALTH_PORT=9091
WORKER_BIND_ADDRESS=10.0.0.3
MAIL_DELIVERY_RELAY_URL=http://mail-relay:9092/send
MAIL_DELIVERY_RELAY_TOKEN=JOUW_BESTAANDE_RELAY_TOKEN

IMAP_HOST=mail.globetrotr.nl
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=JOUW_BESTAANDE_IMAP_GEBRUIKER
IMAP_PASSWORD=JOUW_BESTAANDE_IMAP_WACHTWOORD
IMAP_MAILBOX=INBOX
IMAP_SYNC_INTERVAL_MS=60000
IMAP_INITIAL_LOOKBACK_DAYS=14
MAILBOX_CREDENTIALS_KEY=DEZELFDE_BASE64_SLEUTEL_ALS_NODE_01

VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_PRO_MONTHLY_PRICE_ID=pri_VUL_PRO_IN
VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_VUL_AGENCY_IN
PADDLE_API_KEY=pdl_sdbx_apikey_VUL_IN
PADDLE_WEBHOOK_SECRET=pdl_ntfset_VUL_IN
```

Het Paddle client-token is niet nodig op Node-02. Controleer daarna de
mailrelayconfiguratie zonder de wachtwoorden te wijzigen:

```bash
nano .env.mail-relay
```

Daarin moeten in ieder geval de bestaande SMTP-host, poort, gebruiker,
wachtwoord, afzender en hetzelfde relaytoken staan. Sla op en start alles:

```bash
chmod 600 .env.production .env.mail-relay
docker compose --env-file .env.production -f deploy/worker.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml build --pull
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=150 worker mail-relay imap-sync
curl -fsS http://10.0.0.3:9091/health
```

`worker`, `mail-relay` en `imap-sync` moeten draaien. De workerhealth hoort JSON
met `status` terug te geven.

## 7. Node-01: private verbinding en webhookroute controleren

Log opnieuw in op Node-01:

```powershell
ssh globetrotr@2.28.36.231
```

Voer uit:

```bash
curl -fsS http://10.0.0.3:9091/health
curl -i -X POST https://globetrotr.nl/api/paddle/webhook -H 'Content-Type: application/json' --data '{}'
```

De eerste opdracht moet workerhealth tonen. De tweede moet `HTTP/2 401` met
`INVALID_SIGNATURE` geven. Dat bewijst dat Caddy de publieke route naar Node-02
stuurt en dat een ongesigneerd verzoek wordt geweigerd.

## 8. Servicemail en IMAP controleren

Voer op Node-02 uit:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>console.log(r.status,await r.text()))"
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 mail-relay imap-sync
```

De relayhealth moet `200` en `smtp:"reachable"` tonen. Test daarna vanuit het
portaal:

1. open **Corporate Admin > Bedrijfsmail**;
2. maak of selecteer een werkelijk bestaand ZXCS-postvak;
3. stuur één bericht naar een bestaand extern adres;
4. antwoord vanaf dat externe adres;
5. controleer verzending, HTML-handtekening, inboxsync en melding rechtsboven.

Een mailbox in GlobeTrotr maakt geen fysiek ZXCS-postvak. Maak het postvak of de
alias dus eerst bij ZXCS aan.

## 9. Paddle Sandbox end-to-end controleren

Open GlobeTrotr met een nieuw testaccount en volg deze volgorde:

1. Open **Abonnement & facturatie**.
2. Kies Pro en rond de Sandbox-checkout af.
3. Wacht enkele seconden en kies **Status vernieuwen**.
4. Controleer dat Pro actief is en precies één transactie bestaat.
5. Download de factuur.
6. Open Customer Portal.
7. Wijzig Pro naar Agency en controleer de verrekening.
8. Controleer de NL- of EN-betaalmail en melding rechtsboven.
9. Open **Corporate Admin > Financiën** en controleer abonnement, omzet,
   transactie, factuur en webhookstatus.
10. Vraag vanuit Corporate Admin een volledige terugbetaling aan.
11. Controleer daarna refundstatus, aangepaste factuur en Paddle-creditnota.

Doorloop vervolgens alle Paddle-punten in **Corporate Admin > Releasecheck**.
Vink alleen scenario's af die werkelijk zijn uitgevoerd.

## 10. Agency-domein controleren

1. Open Agency Admin en sla een testdomein op.
2. Maak bij de DNS-provider de getoonde CNAME naar `globetrotr.nl`.
3. Maak het getoonde TXT-record op `_globetrotr.<domein>`.
4. Kies **DNS controleren en activeren**.
5. Open het domein via HTTPS.
6. Controleer dat een onbekend domein geen certificaat krijgt.

Een `naam.globetrotr.nl`-subdomein gebruikt de bestaande wildcard-DNS. Een
extern Agency-domein heeft altijd de CNAME- en TXT-controle nodig.

## 11. Pas na geslaagde Sandbox-tests naar Paddle Live

Herhaal in Paddle Live de product-, token-, API-key- en webhookstappen. Live en
Sandbox hebben andere waarden. Zet daarna op beide nodes:

```dotenv
VITE_PADDLE_ENVIRONMENT=production
```

Vervang alle Paddlewaarden door hun livevariant en bouw beide composeprojecten
opnieuw met de commando's uit stap 5 en 6. Doe daarna één echte Pro-betaling,
factuurdownload en volledige terugbetaling.

## 12. Eindcontrole en rollback

Node-01:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web caddy
curl -fsSI https://globetrotr.nl
curl -fsS http://10.0.0.3:9091/health
```

Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker mail-relay imap-sync
curl -fsS http://10.0.0.3:9091/health
```

Als Node-01 door een configuratiefout niet start, herstel daar het vorige
omgevingbestand en bouw de webstack opnieuw:

```bash
cp .env.production.backup-before-1160 .env.production
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build
```

Als Node-02 door een configuratiefout niet start, voer daar uit:

```bash
cp .env.production.backup-before-1160 .env.production
cp .env.mail-relay.backup-before-1160 .env.mail-relay
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build
```

Een databasemigratie wordt niet teruggedraaid door een oude container te
starten; los een SQL-probleem daarom op met een nieuwe, voorwaartse migratie.
