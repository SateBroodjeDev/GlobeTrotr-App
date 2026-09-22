# GlobeTrotr op twee kale Ubuntu 22.04-servers

> Deze handleiding is voor de eerste installatie van kale servers. Gebruik voor
> de huidige uitrol vanaf migratie 1180 de actuele stappenlijst in
> [`IMPLEMENTATION_PENDING.md`](IMPLEMENTATION_PENDING.md).

Git en SSH verzorgen de deployment.

| Server      | IPv4              | Functie                        |
| ----------- | ----------------- | ------------------------------ |
| GBT-Node-01 | `2.28.36.231`     | webapp, Caddy, HTTPS           |
| GBT-Node-02 | `178.105.243.191` | worker, mailrelay en IMAP-sync |

## 1. Hetzner en DNS

Maak in Hetzner Cloud een Network `globetrotr-private` met subnet
`10.0.0.0/24`. Koppel beide nodes en gebruik `10.0.0.2` voor Node-01 en
`10.0.0.3` voor Node-02.

Maak een firewall voor Node-01: TCP 22 vanaf je beheer-IP, TCP 80/443 en UDP
443 vanaf overal. Maak een firewall voor Node-02 met alleen TCP 22 vanaf je
beheer-IP. Maak vervolgens deze DNS-records:

```text
globetrotr.nl A 2.28.36.231
www.globetrotr.nl CNAME globetrotr.nl
dashboard.globetrotr.nl CNAME globetrotr.nl
portal.globetrotr.nl CNAME globetrotr.nl
```

Voeg AAAA pas toe nadat IPv6 apart is getest.

## 2. Installeer Node-01

Open PowerShell:

```powershell
ssh root@2.28.36.231
```

Voer op de server uit:

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat >/etc/apt/sources.list.d/docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: jammy
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
adduser --disabled-password --gecos '' globetrotr
usermod -aG sudo,docker globetrotr
install -d -m 700 -o globetrotr -g globetrotr /home/globetrotr/.ssh
cp /root/.ssh/authorized_keys /home/globetrotr/.ssh/authorized_keys
chown globetrotr:globetrotr /home/globetrotr/.ssh/authorized_keys
chmod 600 /home/globetrotr/.ssh/authorized_keys
mkdir -p /opt/globetrotr
chown globetrotr:globetrotr /opt/globetrotr
docker --version
docker compose version
exit
```

Log opnieuw in en haal de code op:

```powershell
ssh globetrotr@2.28.36.231
```

```bash
git clone https://github.com/SateBroodjeDev/globetrotr-1d042353.git /opt/globetrotr
cd /opt/globetrotr
git switch lovable
git pull --ff-only origin lovable
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Vul op Node-01 minimaal in:

```dotenv
SUPABASE_URL=https://mucvqudlzntywnyqucfo.supabase.co
SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SECRET_KEY>
VITE_SUPABASE_URL=https://mucvqudlzntywnyqucfo.supabase.co
VITE_SUPABASE_PROJECT_ID=mucvqudlzntywnyqucfo
VITE_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
VITE_TURNSTILE_SITE_KEY=<TURNSTILE_SITE_KEY>
TURNSTILE_SECRET_KEY=<TURNSTILE_SECRET_KEY>
SKYLINK_API_KEY=<SKYLINK_API_KEY>
GITHUB_ISSUES_TOKEN=<GITHUB_TOKEN_OF_LEEG>
GITHUB_ISSUES_REPOSITORY=SateBroodjeDev/globetrotr-1d042353
CRON_SECRET=<LANG_WILLEKEURIG_SECRET>
WORKER_HEALTH_URL=http://10.0.0.3:9091/health
```

Maak het cronsecret met `openssl rand -hex 32`. Geheimen krijgen nooit een
`VITE_`-prefix.

Start Node-01:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web caddy
curl -I https://globetrotr.nl
curl -I https://www.globetrotr.nl
curl -I https://dashboard.globetrotr.nl
```

## 3. Installeer Node-02

Open een tweede PowerShell-venster:

```powershell
ssh root@178.105.243.191
```

Voer dezelfde Docker-installatie uit:

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat >/etc/apt/sources.list.d/docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: jammy
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw --force enable
adduser --disabled-password --gecos '' globetrotr
usermod -aG sudo,docker globetrotr
install -d -m 700 -o globetrotr -g globetrotr /home/globetrotr/.ssh
cp /root/.ssh/authorized_keys /home/globetrotr/.ssh/authorized_keys
chown globetrotr:globetrotr /home/globetrotr/.ssh/authorized_keys
chmod 600 /home/globetrotr/.ssh/authorized_keys
mkdir -p /opt/globetrotr
chown globetrotr:globetrotr /opt/globetrotr
exit
```

Log opnieuw in, clone en maak de configuratie:

```powershell
ssh globetrotr@178.105.243.191
```

```bash
git clone https://github.com/SateBroodjeDev/globetrotr-1d042353.git /opt/globetrotr
cd /opt/globetrotr
git switch lovable
git pull --ff-only origin lovable
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Vul op Node-02 minimaal in:

```dotenv
SUPABASE_URL=https://mucvqudlzntywnyqucfo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SECRET_KEY>
WORKER_POLL_MS=5000
WORKER_BATCH_SIZE=20
WORKER_HEALTH_PORT=9091
WORKER_BIND_ADDRESS=10.0.0.3
WORKER_HEALTHCHECK_HOSTS=api.open-meteo.com,api.met.no,api.frankfurter.app,data.skylinkapi.com
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=30000
MAIL_DELIVERY_RELAY_URL=
MAIL_DELIVERY_RELAY_TOKEN=
```

Vervang die laatste twee regels voor de mailtest door:

```dotenv
MAIL_DELIVERY_RELAY_URL=http://mail-relay:9092/send
MAIL_DELIVERY_RELAY_TOKEN=<RELAY_TOKEN>
```

Maak hetzelfde token en het aparte relaybestand:

```bash
cd /opt/globetrotr
openssl rand -hex 32
cp mail-relay.env.example .env.mail-relay
chmod 600 .env.mail-relay
nano .env.mail-relay
```

Plaats het gegenereerde token zowel als `MAIL_DELIVERY_RELAY_TOKEN` in
`.env.production` als `MAIL_RELAY_TOKEN` in `.env.mail-relay`. Vul in het
relaybestand de SMTP-host, poort, gebruiker, wachtwoord en afzender van je
bestaande maildienst in. Gebruik voor poort 465 `SMTP_SECURE=true`; gebruik voor
poort 587 normaal `SMTP_SECURE=false` en `SMTP_REQUIRE_TLS=true`.

Start Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml build --pull
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker imap-sync mail-relay clamav
docker compose --env-file .env.production -f deploy/worker.compose.yml ps clamav worker imap-sync mail-relay
curl --fail http://127.0.0.1:9091/health
curl --fail http://10.0.0.3:9091/health
```

ClamAV is verplicht voor bedrijfsmailbijlagen en blijft alleen binnen het Compose-netwerk bereikbaar. Open TCP 3310 niet in UFW of de providerfirewall. Wacht bij de eerste start totdat `clamav` healthy is; het downloaden en laden van virusdefinities kan enkele minuten duren. Bij scanneruitval blokkeert GlobeTrotr bijlagen bewust.

Voor gratis NL/EN-vertaalconcepten draait optioneel LibreTranslate op Node-02. Vul daar `TRANSLATION_BIND_ADDRESS=10.0.0.3` in en start `docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d`. Zet op Node-01 `TRANSLATION_API_URL=http://10.0.0.3:5000/translate`, laat `TRANSLATION_API_KEY` leeg en bouw de webcontainer opnieuw. Sta TCP 5000 uitsluitend toe tussen de private adressen van Node-01 en Node-02. De actuele commando's en acceptatietest staan in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md).

De eerste healthcheck kan kort `503` geven. Voer op Node-01 daarna uit:

```bash
curl --fail http://10.0.0.3:9091/health
```

## 4. SMTP en inkomende mail

Supabase Custom SMTP verzorgt Auth-mails zoals registratie en
wachtwoordherstel. Als dit al werkt, hoef je daarvoor niets op de VPS te
installeren.

De GlobeTrotr-worker gebruikt voor app- en bedrijfsmail de interne relaycontainer
`http://mail-relay:9092/send`. De SMTP-inloggegevens staan uitsluitend in
`.env.mail-relay`; poort 9092 wordt niet op de host of het internet gepubliceerd.
Inkomende bedrijfsmail vereist daarnaast IMAP of een provider-webhook.

Controleer op Node-02 eerst de relay en SMTP-verbinding:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 mail-relay worker
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>console.log(r.status,await r.text()))"
```

De log moet `relay.started` met `smtpVerified:true` tonen. Laat
`email_delivery_config.mode` tijdens deze technische controle op `test`. Zet hem
pas op `live` nadat een gecontroleerd testbericht succesvol is bezorgd.

Stuur vanaf de workercontainer één gecontroleerd relaybericht. Vervang alleen het testadres:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml exec -e RELAY_TEST_TO=jouw-adres@example.nl worker node -e 'const id=crypto.randomUUID();fetch(process.env.MAIL_DELIVERY_RELAY_URL,{method:"POST",headers:{Authorization:`Bearer ${process.env.MAIL_DELIVERY_RELAY_TOKEN}`,"Content-Type":"application/json","Idempotency-Key":id},body:JSON.stringify({id,to:process.env.RELAY_TEST_TO,locale:"nl",templateKey:"platform",payload:{title:"GlobeTrotr mailtest",body:"De beveiligde SMTP-relay werkt."}})}).then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.error(e.message);process.exit(1)})'
```

Een HTTP 502 betekent dat de relay de aanvraag heeft geaccepteerd, maar de SMTP-server het verzenden niet afrondde. Bekijk dan direct de veilige foutcode en controleer de SMTP-verbinding:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 mail-relay
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>console.log(r.status,await r.text()))"
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e 'console.log({host:process.env.SMTP_HOST,port:process.env.SMTP_PORT,secure:process.env.SMTP_SECURE,requireTLS:process.env.SMTP_REQUIRE_TLS,userSet:Boolean(process.env.SMTP_USER),passwordSet:Boolean(process.env.SMTP_PASSWORD),from:process.env.SMTP_FROM_ADDRESS})'
```

Gebruik poort 587 met `SMTP_SECURE=false` en `SMTP_REQUIRE_TLS=true`, of poort 465 met `SMTP_SECURE=true`. `SMTP_FROM_ADDRESS` moet een afzender zijn die het SMTP-account werkelijk mag gebruiken. Bouw de relay na een codewijziging opnieuw met `docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build`.

Controleer inbox en spammap. Zet na deze test de outbox bewust aan:

```sql
UPDATE public.email_delivery_config SET mode='live',updated_at=now() WHERE id=true;
```

## 5. Agency-domeinen en bestanden

Het Caddyfile gebruikt on-demand TLS met een `ask`-endpoint op Node-02. Dat
endpoint staat alleen geregistreerde GlobeTrotr-subdomeinen of geverifieerde
eigen domeinen toe wanneer het workspaceplan Agency is. Voor
`naam.globetrotr.nl` is een wildcard **A**-record naar Node-01 nodig; het
certificaat wordt per toegestane host aangevraagd. Er is geen wildcardcertificaat
of DNS-provider-API-koppeling.

Voor een eigen domein toont Agency-instellingen de vereiste CNAME naar
`portal.globetrotr.nl` en een TXT-token. De applicatie controleert beide
records, of dezelfde publieke IPv4-bestemming plus TXT voor een apex/ALIAS.
De domeineigenaar publiceert die records zelf. Geef het domein pas vrij na
controle van DNS, certificaat, inloggen, klanttoegang en de juiste workspace.
De hostname-naar-workspacebinding op alle app-routes is nog een afzonderlijke
acceptatievoorwaarde. Zie [PRE_RELEASE.md](PRE_RELEASE.md).

## 6. Auth-URL en acceptatie

**Bestaande productie:** wijzig de Site URL niet voordat `portal.globetrotr.nl` via HTTPS bereikbaar is en de nieuwe webbuild draait. De volledige volgorde en de tijdelijke oude redirects staan in [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md). Onderstaande waarden gelden pas na de omschakeling.

Stel in Supabase onder Authentication, URL Configuration in:

```text
Site URL: https://portal.globetrotr.nl
Redirect URL: https://portal.globetrotr.nl/oauth-callback
```

Configureer **Authentication → SMTP Settings** met dezelfde werkende SMTP-host,
poort, gebruiker en wachtwoord. Deze Supabase-instelling verzorgt registratie,
wachtwoordherstel en e-mailadreswijzigingen; de worker-relay doet dat niet. De
melding `Error sending confirmation email` wijst op deze SMTP-configuratie.

Gebruik onder **Authentication → Email Templates → Confirm signup**:

```html
<a href="{{ .SiteURL }}/token/{{ .TokenHash }}?type=email">Bevestig mijn account</a>
```

Gebruik voor e-mailadreswijziging `?type=email_change` en voor herstel
`?type=recovery`. Stel onder **Authentication → Passkeys** in:

```text
Relying Party Display Name: GlobeTrotr
Relying Party ID: globetrotr.nl
Relying Party Origins: https://globetrotr.nl, https://portal.globetrotr.nl
```

Controleer de eigen merkassets:

```bash
curl --fail --head https://globetrotr.nl/assets/brand/logo.png
curl --fail --head https://globetrotr.nl/assets/email/logo.png
```

Laat localhost tijdelijk als extra redirect staan. Test daarna registratie,
login, wachtwoordherstel, serverfuncties, uploads, Corporate Admin en workerstatus.

## 7. Updates en rollback

Update Node-01 met:

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/web.compose.yml build
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
```

Gebruik op Node-02 dezelfde opdrachten met `deploy/worker.compose.yml`. Noteer
voor een update `git rev-parse HEAD`. Herstel bij problemen met:

```bash
git checkout <VORIGE_COMMIT>
docker compose --env-file .env.production -f deploy/web.compose.yml build
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
```

Draai productiemigraties niet blind terug; maak databasecorrecties als een
nieuwe voorwaartse migratie.
