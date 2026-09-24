# Eigen GlobeTrotr-mailserver installeren

> Afzonderlijk toekomstig infrastructuurproject. Dit hoort niet bij release 1.0. ZXCS blijft actief totdat Hetzner TCP 25 vrijgeeft en deze volledige handleiding inclusief terugvaltest is afgerond. Voor gewone serverupdates gebruik je `SERVER_OPERATIONS.md`.

Deze handleiding verplaatst `@globetrotr.nl` later van ZXCS naar Stalwart op Node-02. Werk van boven naar beneden en sla geen controle over.

## Wat doe je nu?

Voer voorlopig **stap 1 tot en met stap 6** uit:

1. maak de ZXCS-back-up;
2. stel A en PTR in;
3. open de vijf mailpoorten;
4. start Stalwart en log in op het beheer.

5. configureer het domein en de basisaccounts;
6. koppel Corporate Admin aan Stalwart.

Stop daarna voor een gezamenlijke controle. Directe tests uit stap 7 mogen daarna, maar volledige externe aflevering en stap 8 wachten op de schriftelijke vrijgave door Hetzner. Stap 8 is het enige moment waarop de actieve mailroute verandert.

## Wat blijft voorlopig werken?

ZXCS blijft de actieve mailserver tijdens stappen 1 tot en met 7. Je normale mail blijft dus werken. Het MX-record wijzigen we pas in stap 8, nadat de nieuwe server volledig is getest.

> **Tijdelijke blokkade:** Hetzner staat de aanvraag voor uitgaand TCP 25 en 465 pas toe als het account 30 dagen oud is. Op 23 september 2026 resteerden volgens de eigenaar nog ongeveer 20 dagen. Wijzig tot de schriftelijke goedkeuring geen MX-record en zet `.env.mail-relay` niet van ZXCS naar Stalwart om.

Houd op Node-01 in `.env.production` gedurende deze periode ook het unieke boekingsadres uitgeschakeld:

```dotenv
TRIP_BOOKING_MAIL_ENABLED=false
```

Zet dit pas na de geslaagde MX- en boekingsmailtest op `true` en herstart daarna de webcontainer.

## Wat heb je nodig?

- toegang tot Node-02;
- toegang tot Node-01;
- toegang tot de DNS-instellingen van `globetrotr.nl`;
- toegang tot de VPS-instellingen voor firewall en PTR/rDNS;
- een werkende ZXCS-back-up;
- een wachtwoordmanager.

Schrijf voor jezelf op:

```text
Publiek IPv4-adres Node-02:
Privé-IP Node-02: 10.0.0.3
Privé-IP Node-01: 10.0.0.2
Huidige MX-server van ZXCS:
```

Plaats nooit wachtwoorden, API-keys of tokens in Git.

---

## Stap 1 — maak eerst een ZXCS-back-up

Maak vanuit ZXCS een back-up of export van:

- alle postvakken en mappen;
- aliassen en doorstuurregels;
- berichtaantallen per postvak;
- huidige MX-, SPF-, DKIM- en DMARC-records.

Bewaar deze back-up buiten Node-02.

**Ga pas verder wanneer je zeker weet dat de ZXCS-back-up bestaat.**

---

## Stap 2 — stel het mailadres van Node-02 in

### Bij je VPS-provider

Zoek het publieke IPv4-adres van Node-02. Stel PTR/rDNS in op:

```text
mail.globetrotr.nl
```

### Bij je DNS-provider

Maak of wijzig:

```text
Type: A
Naam: mail
Waarde: PUBLIEK_IP_VAN_NODE_02
TTL: 300
```

Wijzig het MX-record nog niet. Voeg nog geen IPv6/AAAA-record toe.

### Controleren op je Windows-pc

```powershell
Resolve-DnsName mail.globetrotr.nl -Type A
```

Het resultaat moet het publieke IPv4-adres van Node-02 tonen.

Controleer daarna PTR met het echte IP-adres:

```powershell
Resolve-DnsName PUBLIEK_IP_VAN_NODE_02 -Type PTR
```

Het resultaat moet `mail.globetrotr.nl` zijn.

**Stop als A en PTR niet naar elkaar verwijzen.** DNS kan enige tijd nodig hebben.

---

## Stap 3 — open de benodigde poorten op Node-02

### Providerfirewall

Sta op Node-02 inkomend TCP toe voor:

```text
25, 443, 465, 587, 993
```

Beperk SSH-poort 22 tot je eigen beheer-IP. Open poort 8080 niet publiek.

### UFW op Node-02

```bash
sudo ufw allow 25/tcp comment 'Mail SMTP'
sudo ufw allow 443/tcp comment 'Mail HTTPS'
sudo ufw allow 465/tcp comment 'Mail SMTPS'
sudo ufw allow 587/tcp comment 'Mail submission'
sudo ufw allow 993/tcp comment 'Mail IMAPS'
sudo ufw status numbered
```

### Verplicht: Hetzner laten vrijgeven

Hetzner blokkeert op nieuwe Cloud-accounts standaard **uitgaand TCP 25 en 465**. Voor een zelfstandige mailserver moet vooral uitgaand TCP 25 worden vrijgegeven; zonder deze poort kan Stalwart niet rechtstreeks bij andere mailservers bezorgen.

Hetzner accepteert zo'n verzoek normaal pas nadat het account minimaal één maand bestaat en de eerste factuur is betaald. Open in Hetzner Console **Support → Limits → Limit request** en vraag vrijgave van poorten 25 en 465 voor het account aan. Gebruik de voorbeeldtekst onderaan deze stap.

Ga niet door naar de uiteindelijke mailmigratie zolang Hetzner de vrijgave niet schriftelijk heeft bevestigd. Poort 587 blijft beschikbaar voor een externe SMTP-relay, maar vervangt poort 25 niet voor een volledig zelfstandige mailserver.

Voorbeeld voor het verzoek:

```text
Hello,

I would like to request the removal of the outbound port 25 and 465 restriction for my Cloud account.

I am deploying a self-hosted Stalwart mail server for my own domain, globetrotr.nl, on a dedicated Cloud server. The server will host only our own company, staff and application-generated trip mailboxes. It will not provide public registration, bulk marketing or third-party mail relay services.

We will configure matching forward and reverse DNS for mail.globetrotr.nl, SPF, DKIM, DMARC, MTA-STS and TLS reporting. Authenticated submission is rate-limited, the server is monitored, attachments are scanned, and abuse@globetrotr.nl and postmaster@globetrotr.nl will be monitored. Open relay is disabled.

Could you please enable outbound TCP ports 25 and 465 for this account?

Kind regards
```

---

## Stap 4 — start Stalwart op Node-02

Voer op Node-02 uit:

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable

docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  up -d stalwart

docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  ps stalwart

docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  logs --tail=100 stalwart
```

Verwacht bij `ps` dat Stalwart `Up` toont.

### Open het beheer veilig vanaf je pc

Open een nieuw PowerShell-venster:

```powershell
ssh -L 8080:127.0.0.1:8080 globetrotr@PUBLIEK_IP_VAN_NODE_02
```

Laat dit venster open en ga in je browser naar:

```text
http://127.0.0.1:8080/admin
```

Gebruik de tijdelijke inloggegevens uit de Stalwart-log. Maak daarna:

1. een permanente beheerder;
2. een sterk uniek wachtwoord;
3. MFA voor deze beheerder.

Herstart Stalwart op Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server restart stalwart
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server ps stalwart
```

Controleer daarna:

```text
https://mail.globetrotr.nl/admin
```

**Stop als HTTPS een certificaatfout geeft of inloggen niet werkt.**

---

## Stap 5 — configureer GlobeTrotr in Stalwart

Open Stalwart WebAdmin.

1. Ga naar **Management → Domains**.
2. Voeg `globetrotr.nl` toe.
3. Gebruik `mail.globetrotr.nl` als mailhost.
4. Laat Stalwart DKIM genereren.
5. Bewaar de DNS-records die Stalwart toont; publiceer nog geen nieuw MX-record.
6. Maak deze accounts:

```text
postmaster@globetrotr.nl
abuse@globetrotr.nl
service@globetrotr.nl
mailtest@globetrotr.nl
```

Geef `service@globetrotr.nl` en `mailtest@globetrotr.nl` ieder een ander sterk wachtwoord.

---

## Stap 6 — koppel Corporate Admin aan Stalwart

### Maak een beperkte API-key

Maak in Stalwart een afzonderlijke servicegebruiker voor GlobeTrotr. Maak daarna bij **Account → Credentials → API Keys** een key met modus **Replace**.

Geef alleen rechten om accounts:

- op te zoeken;
- te lezen;
- aan te maken;
- bij te werken.

Geef geen rechten voor verwijderen, configuratie, logs, mailinhoud of wachtrijen. Bewaar de API-key direct in je wachtwoordmanager. Noteer ook het ID van het domein `globetrotr.nl`.

### Node-02 configureren

```bash
cd /opt/globetrotr
nano .env.production
```

Voeg toe:

```dotenv
STALWART_URL=http://stalwart:8080
STALWART_API_TOKEN=DE_BEPERKTE_API_KEY
STALWART_DOMAIN_ID=HET_DOMEIN_ID
WORKER_BIND_ADDRESS=10.0.0.3
```

Controleer dat `MAILBOX_CREDENTIALS_KEY` nog bestaat. Deze waarde moet op Node-01 en Node-02 exact gelijk zijn.

Herstart op Node-02 alleen Stalwart en de worker:

```bash
cd /opt/globetrotr
docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  up -d --build --force-recreate stalwart worker

docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  ps
```

Test de mailservercontrole:

```bash
docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  exec worker node -e "fetch('http://127.0.0.1:9091/health/mail').then(async r=>console.log(r.status,await r.text()))"
```

Verwacht HTTP `200`.

### Node-01 configureren

```bash
cd /opt/globetrotr
nano .env.production
```

Voeg toe:

```dotenv
MAIL_SERVER_HEALTH_URL=http://10.0.0.3:9091/health/mail
```

Op Node-02 moet poort 9091 uitsluitend vanaf Node-01 bereikbaar zijn:

```bash
sudo ufw allow from 10.0.0.2 to 10.0.0.3 port 9091 proto tcp comment 'Private mail health'
```

---

## Stap 7 — test voordat je echte mail omzet

### Corporate Admin

Open **Corporate Admin → Bedrijfsmail** en maak een nieuw testpostvak:

```text
mailtest2@globetrotr.nl
```

Kies **Host op de GlobeTrotr-mailserver**, wijs het aan jezelf toe en sla op.

De status moet worden:

```text
pending → provisioning → ready
```

Controleer in Stalwart dat het account werkelijk is aangemaakt.

### Mailprogramma

Gebruik het bestaande `mailtest@globetrotr.nl`-account:

```text
IMAP-server: mail.globetrotr.nl
IMAP-poort: 993
IMAP-beveiliging: TLS

SMTP-server: mail.globetrotr.nl
SMTP-poort: 465 (TLS) of 587 (STARTTLS)
```

Test:

- inloggen;
- verzenden naar Gmail;
- verzenden naar Outlook/Hotmail;
- HTML-mail;
- handtekening;
- een normale bijlage;
- reply ontvangen;
- een verkeerd wachtwoord wordt geweigerd.

Controleer bij Gmail/Outlook in de bron van het bericht:

```text
SPF: PASS
DKIM: PASS
DMARC: PASS
```

### Automatisch reisadres

Maak in een testreis een `trip.*@globetrotr.nl`-adres. Controleer in Stalwart dat het account bestaat en dat GlobeTrotr nergens het interne wachtwoord laat zien.

**Wijzig het MX-record alleen wanneer alles in stap 7 werkt.**

### Maak vóór de MX-wijziging een Stalwart-back-up

Zoek op Node-02 eerst de twee volumenamen:

```bash
docker volume ls | grep stalwart
```

Maak daarna een momentopname van beide volumes. Gebruik de volumenamen uit de vorige opdracht wanneer die afwijken:

```bash
sudo install -d -m 700 /var/backups/globetrotr-mail
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server stop stalwart

sudo docker run --rm -v deploy_stalwart-etc:/source:ro -v /var/backups/globetrotr-mail:/backup alpine:3.20 sh -c 'cd /source && tar czf /backup/stalwart-etc.tar.gz .'
sudo docker run --rm -v deploy_stalwart-data:/source:ro -v /var/backups/globetrotr-mail:/backup alpine:3.20 sh -c 'cd /source && tar czf /backup/stalwart-data.tar.gz .'

docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server start stalwart
sudo ls -lh /var/backups/globetrotr-mail
```

Kopieer deze bestanden versleuteld naar een andere machine. Test herstel met aparte tijdelijke volumes; overschrijf hiervoor nooit de actieve volumes.

---

## Stap 8 — zet de productierelay en DNS om

Doe dit op een moment waarop je enkele uren kunt controleren.

### 8.1 Publiceer mailbeveiliging

Neem de exacte waarden over die Stalwart voor jouw domein toont:

- SPF: één record dat tijdens de overgang zowel ZXCS als Node-02 toestaat;
- DKIM: de publieke sleutel van Stalwart;
- DMARC: begin met `p=none`;
- MTA-STS;
- TLS-RPT.

Maak nooit twee SPF-records.

### 8.2 Zet de GlobeTrotr-relay om

Op Node-02:

```bash
cd /opt/globetrotr
nano .env.mail-relay
```

Wijzig de SMTP-waarden naar:

```dotenv
SMTP_HOST=stalwart
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=service@globetrotr.nl
SMTP_PASSWORD=HET_SERVICE_WACHTWOORD
SMTP_FROM_ADDRESS=info@globetrotr.nl
SMTP_FROM_NAME=GlobeTrotr
SMTP_ALLOWED_FROM_DOMAINS=globetrotr.nl
```

Laat relaytoken- en poortinstellingen staan. Herstart:

```bash
cd /opt/globetrotr
docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  --profile mail-server \
  up -d --build --force-recreate mail-relay worker imap-sync

docker compose \
  --env-file .env.production \
  -f deploy/worker.compose.yml \
  exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>console.log(r.status,await r.text()))"
```

Verwacht HTTP `200`. Stuur daarna één transactionele testmail. Zet bij problemen direct de bewaarde ZXCS SMTP-waarden terug.

### 8.3 Wijzig nu pas MX

Gebruik het MX-record dat Stalwart toont. Meestal:

```text
Type: MX
Naam: @
Prioriteit: 10
Doel: mail.globetrotr.nl.
TTL: 300
```

Controleer op Windows:

```powershell
Resolve-DnsName globetrotr.nl -Type MX
```

Houd ZXCS actief tijdens DNS-propagatie.

Test onmiddellijk:

1. Gmail → persoonlijk GlobeTrotr-postvak;
2. Outlook → gedeeld GlobeTrotr-postvak;
3. extern → `trip.*`-adres;
4. GlobeTrotr → Gmail en Outlook;
5. registratie-, recovery- en uitnodigingsmail.

Controleer bij iedere ontvangen mail SPF, DKIM en DMARC.

---

## Stap 9 — bestaande mail overzetten en observeren

Kopieer bestaande ZXCS-postvakken via IMAP naar dezelfde Stalwart-postvakken. Begin met één niet-kritiek testpostvak. Vergelijk per map het aantal berichten en controleer bijlagen, datums en gelezenstatus.

Voer na DNS-propagatie nog één laatste incrementele kopie uit voor berichten die tijdens de overgang bij ZXCS binnenkwamen.

Controleer zeven dagen dagelijks op Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server ps
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server logs --since=24h stalwart mail-relay worker imap-sync
df -h
```

Controleer daarnaast bounces, spamplaatsing, DMARC-rapporten, certificaat, back-up en provisioning. Schakel ZXCS pas na deze periode uit.

---

## Als het misgaat

1. Zet het oude ZXCS-MX-record terug.
2. Zet in `.env.mail-relay` de oude ZXCS SMTP-instellingen terug.
3. Herstart `mail-relay`, `worker` en `imap-sync`.
4. Laat Stalwart-accounts en volumes intact.
5. Verwijder geen maildata.

## Wanneer is de migratie klaar?

- persoonlijke, gedeelde en `trip.*`-postvakken werken;
- inkomend en uitgaand mail werkt;
- SPF, DKIM en DMARC geven PASS;
- HTML, handtekening en bijlagen werken;
- back-up en herstel zijn getest;
- bestaande berichten zijn gemigreerd;
- zeven dagen zijn stabiel verlopen;
- ZXCS kan daarna gecontroleerd worden uitgezet.

Officiële naslag: [Stalwart Docker](https://stalw.art/docs/install/platform/docker/), [DNS instellen](https://stalw.art/docs/install/dns/) en [API-keys](https://www.stalw.art/docs/auth/authentication/api-key/).
