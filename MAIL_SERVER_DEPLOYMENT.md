# GlobeTrotr-mailserver op Node-02

Deze uitrol vervangt ZXCS pas nadat ontvangen en verzenden met een testadres zijn geslaagd. GlobeTrotr gebruikt Stalwart Community Edition `v0.16`, met SMTP, IMAPS, DKIM en een interne JMAP-beheer-API. Corp Admin kan daarna persoonlijke, gedeelde en automatische `trip.*@globetrotr.nl`-postvakken provisionen.

## 1. Vooraf

- Maak bij de VPS-provider een PTR/rDNS-record van het publieke IPv4-adres van Node-02 naar `mail.globetrotr.nl`.
- Zet `mail.globetrotr.nl` als A-record naar Node-02. Voeg alleen AAAA toe als IPv6 correct werkt.
- Open bij de provider en in UFW TCP `25`, `443`, `465`, `587`, `993`. Laat `8080` dicht; deze bindt alleen op localhost.
- Maak vóór de MX-wijziging een back-up van alle ZXCS-postvakken.

```bash
sudo ufw allow 25/tcp comment 'SMTP server-to-server'
sudo ufw allow 443/tcp comment 'Stalwart HTTPS and ACME'
sudo ufw allow 465/tcp comment 'SMTP submission TLS'
sudo ufw allow 587/tcp comment 'SMTP submission STARTTLS'
sudo ufw allow 993/tcp comment 'IMAPS'
sudo ufw status numbered
```

## 2. Database en container

Migratie/test 1560 voor mailboxprovisioning, 1570 voor diagnose en herstel en 1580 voor boekingsmailconcepten zijn uitgevoerd. Trek op beide nodes exact dezelfde nieuwe commit binnen; voer de SQL niet opnieuw uit.

Op Node-02:

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server pull stalwart
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server up -d stalwart
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server logs --tail=100 stalwart
```

Maak vanaf je pc een tijdelijke tunnel en open `http://127.0.0.1:8080/admin`:

```powershell
ssh -L 8080:127.0.0.1:8080 globetrotr@IP_VAN_NODE_02
```

Gebruik de eenmalige bootstrapgegevens uit de Stalwart-log. Stel in: servernaam `mail.globetrotr.nl`, domein `globetrotr.nl`, automatische TLS en DKIM, lokale persistente opslag en een permanente beheerder met sterk wachtwoord en MFA. Herstart en controleer daarna `https://mail.globetrotr.nl/admin`. Verwijder recoverycredentials zodra de permanente beheerder werkt. Houd de HTTP-beheerlistener uitsluitend intern beschikbaar voor de worker; Docker publiceert poort 8080 alleen op `127.0.0.1`, nooit op het publieke netwerk.

## 3. Afgeschermde provisioning

Maak in Stalwart een aparte API-key die uitsluitend Account query/get/create/update mag uitvoeren; geef geen delete-, configuratie-, log- of mailboxinhoudrechten. Noteer ook het domein-ID van `globetrotr.nl`.

Voeg alleen op Node-02 toe aan `.env.production`:

```dotenv
STALWART_URL=http://stalwart:8080
STALWART_API_TOKEN=EENMALIG_GETOONDE_API_KEY
STALWART_DOMAIN_ID=GLOBETROTR_DOMEIN_ID
```

Zet op Node-01 in `.env.production` de private diagnose-URL:

```dotenv
MAIL_SERVER_HEALTH_URL=http://10.0.0.3:9091/health/mail
```

De bestaande `MAILBOX_CREDENTIALS_KEY` moet op Node-01 en Node-02 gelijk zijn. Het Stalwart-token staat uitsluitend op Node-02.

Maak in Stalwart handmatig `service@globetrotr.nl` met een lang uniek wachtwoord. Pas `.env.mail-relay` op Node-02 aan:

```dotenv
SMTP_HOST=stalwart
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=service@globetrotr.nl
SMTP_PASSWORD=EEN_UNIEK_LANG_WACHTWOORD
SMTP_FROM_ADDRESS=info@globetrotr.nl
SMTP_FROM_NAME=GlobeTrotr
SMTP_ALLOWED_FROM_DOMAINS=globetrotr.nl
```

Start alles opnieuw:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server up -d --build --force-recreate stalwart mail-relay worker imap-sync
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server ps
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile mail-server logs --tail=100 worker mail-relay imap-sync stalwart
```

## 4. Test vóór de MX-cutover

Maak in Corp Admin → Bedrijfsmail `mailtest@globetrotr.nl`, vink **Host op de GlobeTrotr-mailserver** aan en sla met een sterk wachtwoord op. De status moet `pending`, `provisioning`, daarna `ready` tonen.

Test IMAPS `mail.globetrotr.nl:993`, SMTP `:465`, HTML-mail, afbeeldingen, bijlagen, inkomende mail, SPF/DKIM/DMARC-headers, verkeerde login, rate limiting, malwarebijlagen, schijfruimte en herstel van beide Stalwart-volumes. Maak vanuit een echte reis een automatisch `trip.*@globetrotr.nl`-adres; GlobeTrotr genereert daarvoor intern een wachtwoord. Stuur een bevestiging door en controleer concept, melding, deduplicatie, bevestiging en intrekken.

## 5. DNS-cutover

Publiceer exact de zonegegevens die Stalwart voor `globetrotr.nl` genereert: MX, SPF, DKIM, DMARC, MTA-STS, TLS-RPT en waar gewenst autoconfig/autodiscover. Begin DMARC met `p=none`, controleer rapporten en verhoog daarna naar `quarantine` en `reject`.

Verwijder het oude ZXCS-MX-record pas als de records wereldwijd zichtbaar zijn. Houd ZXCS gedurende de TTL bereikbaar, migreer bestaande mappen met een gecontroleerde IMAP-kopie en vergelijk berichtaantallen.

## 6. Back-up, monitoring en terugval

Back-up dagelijks de volumes `stalwart-etc` en `stalwart-data`, versleuteld naar een andere machine. Test ieder kwartaal herstel. Monitor schijfruimte, SMTP-wachtrij, TLS, DKIM/DMARC, blocklists en workerstatus.

Bij problemen zet je het oude ZXCS-MX-record terug en pauzeer je servicemail. Verwijder geen volumes of accounts. Een postvak op `external` zetten verwijdert nooit serverdata automatisch.
