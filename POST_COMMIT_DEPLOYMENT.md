# Productie bijwerken na deze commit

Voer deze handleiding van boven naar beneden uit. Sla geen migraties over en voer iedere SQL-test pas uit nadat de bijbehorende migratie is geslaagd. Alle praktische controles staan na de migraties ook in **Corporate Admin → Releasecheck**.

## 1. Code naar GitHub sturen

De commit wordt door Codex gemaakt. Controleer daarna op je eigen computer:

```powershell
git branch --show-current
git status
git push origin lovable
```

De branch hoort `lovable` te zijn. `.env` mag niet in `git status` of de commit voorkomen.

## 2. Controleren welke SQL nog ontbreekt

De eigenaar heeft migraties en tests tot en met `20260908112000` al uitgevoerd. Voer na deze commit alleen dit nieuwe bestand uit:

1. `supabase/migrations/20260908113000_branded_corporate_signatures.sql`

Gebruik bij handmatige uitvoering voor ieder bestand afzonderlijk Supabase Dashboard → **SQL Editor → New query**:

1. Open het bestand lokaal in VS Code.
2. Kopieer de volledige inhoud.
3. Plak die in een lege Supabase-query.
4. Kies **Run**.
5. Ga alleen verder wanneer er geen foutmelding staat.

Voer daarna op dezelfde manier deze test uit. Deze wijzigt geen blijvende testdata:

1. `supabase/tests/branded_corporate_signatures.sql`

Stop bij een SQL-fout en bewaar de volledige foutmelding. Zet de bezorgmodus nog niet op live voordat Node-02 opnieuw is gebouwd en de relaytest HTTP `202` geeft.

## 3. Supabase Auth instellen

Controleer in Supabase Dashboard → **Authentication → URL Configuration**:

- Site URL: `https://globetrotr.nl`
- Redirect toegestaan: `https://globetrotr.nl/**`
- Eventuele Agency-subdomeinen pas toevoegen nadat hun routing werkt.

Controleer daarna:

- Custom SMTP en alle templates uit `supabase/templates`, inclusief `invite.html` bij **Invite user**.
- Google en Discord blijven actief zoals reeds werkend bevestigd.
- Passkeys ingeschakeld voor het productieproject.
- TOTP MFA ingeschakeld; handmatig koppelen van identiteiten blijft uitgeschakeld.

## 4. Node-01 bijwerken

Log in op Node-01 en voer uit:

```bash
cd /opt/globetrotr
git status
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web
```

Controleer vervolgens:

```bash
curl -I https://globetrotr.nl
curl -I https://globetrotr.nl/assets/email/logo.png
curl -I https://globetrotr.nl/register
```

De website en assets horen HTTP `200` te geven; een bewuste redirect mag `301`, `302`, `307` of `308` geven.

## 5. Node-02 bijwerken

Log in op Node-02 en voer uit:

```bash
cd /opt/globetrotr
git status
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/worker.compose.yml build --pull
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker mail-relay
curl -fsS http://127.0.0.1:9091/health
```

Vul vóór de herbouw op Node-02 ook de IMAP-instellingen in `.env.production` in:

```dotenv
IMAP_HOST=mail.globetrotr.nl
IMAP_PORT=993
IMAP_SECURE=true
IMAP_REJECT_UNAUTHORIZED=true
IMAP_USER=info@globetrotr.nl
IMAP_PASSWORD=VUL_HET_IMAP_WACHTWOORD_IN
IMAP_MAILBOX=INBOX
IMAP_SYNC_INTERVAL_MS=60000
IMAP_INITIAL_LOOKBACK_DAYS=14
```

`IMAP_USER` moet een bestaand postvak of centraal catch-all-postvak zijn dat de berichten voor de aangemaakte GlobeTrotr-adressen werkelijk ontvangt. GlobeTrotr maakt de administratieve mailbox in het portaal aan; het fysieke postvak of alias moet ook in ZXCS bestaan zolang ZXCS geen provisioning-API aan het portaal aanbiedt.

Controleer na het starten ook de inboxworker:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 imap-sync
```

De containers `worker`, `mail-relay` en `imap-sync` moeten draaien. Poorten `9091` en `9092` mogen niet publiek bereikbaar zijn.

Voer daarna de eerder gebruikte relaytest naar een bestaand testadres uit. Ga alleen verder wanneer deze HTTP `202` geeft en het bericht precies eenmaal aankomt.

## 6. Servicemail gecontroleerd activeren

1. Open **Corporate Admin → Bedrijfsmail**.
2. Controleer dat de modus eerst **Gepauzeerd** is.
3. Maak een reisuitnodiging en controleer dat het bericht als **Vastgehouden** verschijnt.
4. Vul een concrete reden in, bijvoorbeeld `SMTP-relay op Node-02 succesvol getest`.
5. Kies **Livemodus activeren** en bevestig het vrijgeven.
6. Controleer dat het bericht via `In wachtrij` en `Wordt verzonden` naar `Verzonden` gaat en één keer aankomt.
7. Controleer in Corporate Admin → Audit dat de moduswijziging met reden is vastgelegd.

Test ook één mislukte verzending naar een bewust ongeldig testadres. Corporate Admin moet een begrensde foutcode tonen, bijvoorbeeld `SMTP_550_EENVELOPE`. Kies daarna **Opnieuw** met een geldige ontvanger of maak een nieuwe geldige uitnodiging.

## SMTP 550, DNS en serverklok controleren

`SMTP_550_EENVELOPE` met `No such recipient here` ontstaat tijdens `RCPT TO`: de mailserver weigert dat ontvangstadres voordat de inhoud wordt verzonden. Dit is geen SPF- of DKIM-fout. Test met een bestaand extern postvak en laat ZXCS authenticated relay voor de gebruikte SMTP-gebruiker toestaan.

```bash
dig +short MX globetrotr.nl
dig +short TXT globetrotr.nl
dig +short TXT _dmarc.globetrotr.nl
# vervang default door de selector uit het ZXCS-mailpaneel
dig +short TXT default._domainkey.globetrotr.nl

sudo timedatectl set-timezone Europe/Amsterdam
sudo timedatectl set-ntp true
timedatectl status
```

Controleer in Supabase onder **Authentication > SMTP Settings** dat host, poort 587, volledige gebruikersnaam, wachtwoord, afzenderadres en afzendernaam exact bij hetzelfde werkende ZXCS-postvak horen. Herstelmail en magic link gebruiken deze Supabase-instelling, niet de relaycontainer op Node-02. De systeemklok moet `System clock synchronized: yes` tonen. Applicatielogs mogen intern UTC gebruiken; de website toont de accounttijdzone.

## 7. Praktische acceptatie

Doorloop in **Corporate Admin → Releasecheck** minstens deze nieuwe groepen:

- Google en Discord koppelen en veilig ontkoppelen.
- OAuth-registratie levert één profiel en één workspace op.
- Reis- en Agency-uitnodigingen tonen hun e-mailbezorgstatus.
- Servicemail bekijken, pauzeren, hervatten en opnieuw aanbieden.
- Een workerclaim ouder dan tien minuten wordt opnieuw verwerkt met `WORKER_LEASE_EXPIRED`.
- Een taak stopt na maximaal tien mislukte pogingen.

Gebruik een gewone reiziger, Agency-eigenaar, Agency-medewerker en klant. Test Nederlands en Engels op telefoon en desktop. Vink alleen scenario's af die daadwerkelijk zijn uitgevoerd.

## 8. Afsluitende controle

```bash
# Node-01
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml ps

# Node-02
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
curl -fsS http://127.0.0.1:9091/health
```

Controleer daarna registratie, tokenlinks, wachtwoordherstel, magic link, OAuth, passkey, reisuitnodiging, Agency-uitnodiging en de Corporate Admin-mailpagina.

## Nog bewust later

- Paddle na commerciële goedkeuring en domeincontrole.
- Geautomatiseerde CNAME/TXT-onboarding en begrensde certificaatuitgifte voor eigen Agency-domeinen.
- Automatische aanleg van fysieke ZXCS-postvakken en aliassen; dit vereist een provisioning-API van de mailprovider.
- Externe monitoring, volledige back-upherstelproef en de finale securityscan.
