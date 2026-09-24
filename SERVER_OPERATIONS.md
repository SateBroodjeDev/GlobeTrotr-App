# GlobeTrotr serverbeheer

**Stand: 24 september 2026**

Dit is de enige handleiding voor het bijwerken, herstarten, controleren en terugzetten van de bestaande servers. De eerste installatie staat in `VPS_DEPLOYMENT.md`. De inhoud van een specifieke release staat in `IMPLEMENTATION_PENDING.md`.

## Serververdeling

| Server | Map | Composebestand | Actieve diensten |
| --- | --- | --- | --- |
| Node-01 | `/opt/globetrotr` | `deploy/web.compose.yml` | `web`, `caddy` |
| Node-02 | `/opt/globetrotr` | `deploy/worker.compose.yml` | `worker`, `mail-relay`, `imap-sync`, `clamav` |

ZXCS blijft de actieve mailvoorziening. Start het profiel `mail-server` niet zolang `MAIL_SERVER_DEPLOYMENT.md` niet volledig is uitgevoerd. LibreTranslate is optioneel en gebruikt het profiel `translation`.

## Voor iedere update

Voer op beide nodes uit:

```bash
cd /opt/globetrotr
git branch --show-current
git status --short
git fetch origin
git log --oneline HEAD..origin/lovable
```

Ga alleen verder wanneer de branch `lovable` is en `git status --short` leeg is. Bewerk productiegeheimen uitsluitend in `.env.production` en `.env.mail-relay`; deze bestanden horen niet in Git.

Voer nieuwe Supabase-migraties en tests eerst uit in de volgorde uit `IMPLEMENTATION_PENDING.md`.

## Node-01 bijwerken

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=150 web caddy
```

Controleer daarna:

```bash
curl -I https://globetrotr.nl/
curl -I https://portal.globetrotr.nl/dashboard
curl -fsS https://globetrotr.nl/ >/dev/null && echo WEBSITE_OK
```

## Node-02 bijwerken

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/worker.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build --force-recreate worker mail-relay imap-sync clamav
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=200 worker mail-relay imap-sync clamav
```

Controleer daarna:

```bash
curl -fsS http://127.0.0.1:9091/health
docker compose --env-file .env.production -f deploy/worker.compose.yml exec mail-relay node -e "fetch('http://127.0.0.1:9092/health').then(async r=>console.log(r.status,await r.text()))"
```

## Alleen herstarten, zonder nieuwe build

Node-01:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml restart web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
```

Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml restart worker mail-relay imap-sync clamav
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
```

## Alles gecontroleerd stoppen en starten

Gebruik dit alleen voor onderhoud. `down` verwijdert containers en netwerken, maar niet de benoemde volumes.

Node-01:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml down
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build
```

Node-02:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml down
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d --build worker mail-relay imap-sync clamav
```

Voeg nooit `-v` toe: daarmee worden volumes verwijderd.

## Optionele vertaalservice

Alleen wanneer LibreTranslate al is geconfigureerd:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d translation
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation ps
```

## Logs en diagnose

```bash
# Node-01
docker compose --env-file .env.production -f deploy/web.compose.yml logs --since=30m web caddy

# Node-02
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --since=30m worker mail-relay imap-sync clamav

# Continue volgen; stoppen met Ctrl+C
docker compose --env-file .env.production -f deploy/worker.compose.yml logs -f worker
```

Gebruik bij problemen ook:

```bash
docker stats --no-stream
df -h
free -h
timedatectl status
```

## Terugzetten naar de vorige commit

Verander geen gepubliceerde Git-geschiedenis. Zoek eerst de vorige goede commit:

```bash
cd /opt/globetrotr
git log --oneline -10
```

Maak vervolgens een tijdelijke detached checkout van die commit en bouw opnieuw:

```bash
git switch --detach VORIGE_GOEDE_COMMIT
```

Start daarna de betreffende node opnieuw met de updatecommando’s hierboven. Om later terug te gaan naar de normale branch:

```bash
git switch lovable
git pull --ff-only origin lovable
```

Database-migraties worden niet automatisch teruggedraaid. Gebruik daarom alleen voorwaartse herstelmigraties.

## Klaar na een update

- alle verwachte containers zijn `healthy` of `running`;
- website, portal en worker-health antwoorden;
- logs bevatten geen herhaalde fouten;
- de releasechecks uit `IMPLEMENTATION_PENDING.md` slagen;
- accountmail en bedrijfsmail via ZXCS blijven werken;
- de gebruikte commit staat genoteerd bij de uitrol.
