# GlobeTrotr op twee kale Ubuntu 22.04-servers

Git en SSH verzorgen de deployment.

| Server | IPv4 | Functie |
|---|---|---|
| GBT-Node-01 | `2.28.36.231` | webapp, Caddy, HTTPS |
| GBT-Node-02 | `178.105.243.191` | worker, later mailrelay |

## 1. Hetzner en DNS

Maak in Hetzner Cloud een Network `globetrotr-private` met subnet
`10.0.0.0/24`. Koppel beide nodes en gebruik `10.0.0.2` voor Node-01 en
`10.0.0.3` voor Node-02.

Maak een firewall voor Node-01: TCP 22 vanaf je beheer-IP, TCP 80/443 en UDP
443 vanaf overal. Maak een firewall voor Node-02 met alleen TCP 22 vanaf je
beheer-IP. Maak vervolgens dit DNS-record:

```text
dashboard.globetrotr.nl A 2.28.36.231
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
LOVABLE_CRON_SECRET=<LANG_WILLEKEURIG_SECRET>
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
MAIL_DELIVERY_RELAY_URL=
MAIL_DELIVERY_RELAY_TOKEN=
```

Start Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml build --pull
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker
curl --fail http://127.0.0.1:9091/health
curl --fail http://10.0.0.3:9091/health
```

De eerste healthcheck kan kort `503` geven. Voer op Node-01 daarna uit:

```bash
curl --fail http://10.0.0.3:9091/health
```

## 4. SMTP en inkomende mail

Supabase Custom SMTP verzorgt Auth-mails zoals registratie en
wachtwoordherstel. Als dit al werkt, hoef je daarvoor niets op de VPS te
installeren.

De GlobeTrotr-worker verwacht voor app- en bedrijfsmail een beveiligde
HTTP-mailrelay via `MAIL_DELIVERY_RELAY_URL` en `MAIL_DELIVERY_RELAY_TOKEN`.
Alleen bestaande SMTP-host-, poort- en inloggegevens vullen deze koppeling nog
niet in. Laat de twee relaywaarden leeg; e-mail blijft dan veilig in de wachtrij.
Inkomende bedrijfsmail vereist daarnaast IMAP of een provider-webhook. Zet de
databasebezorgmodus pas op `live` nadat deze relay end-to-end is getest.

## 5. Agency-domeinen en bestanden

De eerste livegang gebruikt uitsluitend `dashboard.globetrotr.nl`. Het huidige
Caddyfile en de applicatierouter activeren nog geen Agency op basis van de
hostname. Velden voor `agency.globetrotr.nl`, een eigen domein en DNS-verificatie
bestaan al, maar worden pas actief nadat deze onderdelen zijn gebouwd en getest:

1. een wildcard DNS-record `*.globetrotr.nl` naar Node-01;
2. veilige hostherkenning die alleen een geverifieerde, actieve Agency selecteert;
3. wildcard TLS voor GlobeTrotr-subdomeinen;
4. on-demand TLS met een streng `ask`-endpoint voor geverifieerde eigen domeinen;
5. terugval naar de standaard GlobeTrotr-huisstijl wanneer de Agency of het
   abonnement niet meer actief is.

Voeg daarom nu nog geen wildcard of Agency-domeinen aan Caddy toe. Een onbeperkte
on-demand TLS-configuratie kan door derden worden misbruikt om certificaten aan
te vragen.

Voor een eigen Agency-domein maakt de Agency bij zijn DNS-provider een CNAME,
bijvoorbeeld `reizen.bedrijf.nl CNAME dashboard.globetrotr.nl`. GlobeTrotr
controleert daarnaast een afzonderlijk TXT-record met de bestaande
verificatietoken. Pas na die controle mag Caddy een certificaat aanvragen en de
hostname aan de betreffende workspace koppelen. Een apexdomein zonder subdomein
kan niet bij iedere DNS-provider als gewone CNAME worden ingesteld; gebruik dan
ALIAS/ANAME-flattening of verwijs een subdomein zoals `reizen`.

## 6. Auth-URL en acceptatie

Stel in Supabase onder Authentication, URL Configuration in:

```text
Site URL: https://dashboard.globetrotr.nl
Redirect URL: https://dashboard.globetrotr.nl/**
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
