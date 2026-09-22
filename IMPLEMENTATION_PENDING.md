# GlobeTrotr — actuele uitrol

**Stand: 22 september 2026**

<!-- release-preflight: confirmed-through=20260908147000_agency_portal_entry_acceptance.sql -->

## Huidige productie

- Branch: `lovable`
- Uitgerolde release: `5df0590`
- SQL-migraties en tests: uitgevoerd tot en met **1470**
- Website: `https://globetrotr.nl`
- Portal: `https://portal.globetrotr.nl`
- Node-02 worker, mailrelay en IMAP-sync: uitgerold
- Node-01 web en Caddy: uitgerold
- Portalcertificaat: uitgegeven door Caddy
- Supabase-regio: Central EU (Frankfurt, `eu-central-1`), bevestigd

Na deze productie-uitrol staan twee lokale releases klaar: de correctie voor navigatie van portal terug naar de publieke website en provider-onafhankelijke reisopties vergelijken. Daarvoor horen migratie/tests **1480** en **1490** bij.

## Volgende kleine uitrol

### 1. Lokaal controleren, committen en pushen

```powershell
git status --short
npm run verify
git -c core.safecrlf=false diff --check
git add -A
git diff --cached --name-only
git commit -m "Add portal navigation and trip option comparison"
git push origin lovable
git rev-parse --short HEAD
```

Bewaar de laatste uitvoer als `VERWACHTE_COMMIT`. Commit nooit `.env`, mailboxwachtwoorden, Supabase-servicekeys, Paddle-secrets of SMTP-gegevens.

### 2. Supabase SQL Editor

Voer eerst uit:

1. [1480 — navigatie tussen website en portal](supabase/migrations/20260908148000_cross_domain_navigation_acceptance.sql)
2. [test 1480](supabase/tests/cross_domain_navigation_acceptance.sql)
3. [1490 — reisopties vergelijken](supabase/migrations/20260908149000_trip_options_comparison.sql)
4. [test 1490](supabase/tests/trip_options_comparison.sql)

Alle vier moeten zonder fout eindigen. Migraties tot en met 1470 niet herhalen.

### 3. Node-01 uitrollen

Deze correctie raakt alleen web en Caddy; Node-02 hoeft niet opnieuw gebouwd te worden.

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only origin lovable
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml run --rm --no-deps --entrypoint caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web caddy
```

Stop als `git status --short`, Compose-configuratie, Caddy-validatie of build faalt.

### 4. Technische controle

```bash
curl -I https://globetrotr.nl/
curl -I https://portal.globetrotr.nl/
curl -I https://portal.globetrotr.nl/auth
curl -I https://portal.globetrotr.nl/register
curl -I https://portal.globetrotr.nl/features
curl -I https://globetrotr.nl/account
```

Verwacht:

- website: 200;
- portal-root: 302 naar `/dashboard`;
- auth en register: 200;
- `portal.globetrotr.nl/features`: 302 naar `https://globetrotr.nl/features`;
- `globetrotr.nl/account`: 302 naar `https://portal.globetrotr.nl/account`;
- portal bevat `X-Robots-Tag: noindex, nofollow`.

### 5. Praktijktest

- Klik op portal het logo en **Website**: beide openen `globetrotr.nl`.
- Controleer publieke menu- en footerlinks op telefoon en desktop.
- Controleer dat **Reizen**, account, betaling, Agency Admin en Corporate Admin op portal blijven.
- Test uitloggen en opnieuw inloggen; sessies worden niet tussen hosts gedeeld.
- Rond Corporate Admin-item `public.cross-domain-navigation` af.
- Voeg in een reis minimaal twee kandidaten toe en vergelijk ze op prijs, duur, afstand en annuleringsinformatie.
- Controleer kandidaatfilters en sortering op telefoon en desktop; archiveer daarna één kandidaat.
- Kies één kandidaat, controleer dat deze bij Boekingen staat en bevestig dat nogmaals kiezen geen tweede boeking maakt.
- Controleer met een viewer dat toevoegen, archiveren, verwijderen en kiezen niet beschikbaar zijn.
- Rond Corporate Admin-item `trip.options-comparison` pas na deze praktijktest af.

## Overige open acceptatie

De code is pas publiek gereed nadat registratie, Auth-mail, OAuth, bestaande/nieuwe passkeys, TOTP, Paddle, live agenda, bedrijfsmail, privacyverzoeken en Agency-domeinen met echte accounts zijn gecontroleerd. Gebruik hiervoor [PRE_RELEASE.md](PRE_RELEASE.md), [TEST_CHECKLIST.md](TEST_CHECKLIST.md) en [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md).

## Terugval

Bij een fout: wijzig Supabase Auth niet opnieuw, herstel Node-01 naar de vorige bekende image of maak een normale herstelcommit. Herschrijf de Lovable-Gitgeschiedenis niet. De bestaande portal-DNS en certificaten kunnen blijven staan.
