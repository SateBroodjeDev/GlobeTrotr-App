# Domeinscheiding: website, portal en Agency

**Voorbereid, nog niet uitgerold (22 september 2026).** Dit document hoort bij de volgende gezamenlijke release. De bestaande applicatie blijft één webbuild; Caddy en de app kiezen op basis van de host de juiste ingang. De database en accounts verhuizen niet.

| Host | Doel | Status na deze code-uitrol |
| --- | --- | --- |
| `globetrotr.nl` | Homepage, demo, prijzen, contact, status, privacy, openbare reizen en agenda-feed | Publieke site |
| `portal.globetrotr.nl` | Registratie, login, dashboard, reizen, account, betaling, Agency- en Corporate Admin | Centrale portalingang voor Free, Pro en Agency |
| `dashboard.globetrotr.nl` | Oude links | Redirect naar `portal` met pad |
| `bedrijf.globetrotr.nl` | Agency-ingang | De geregistreerde actieve host stuurt door naar het centrale Agency-dashboard met een workspacecontrole. Login blijft op `portal`. |
| `reizen.bedrijf.nl` | Eigen Agency-domein | Na CNAME/TXT-verificatie en actief Agency-plan dezelfde gecontroleerde doorverwijzing. |

Een Agency-host is nu een **eigen ingang**, geen aparte app-origin. Bij bezoek aan de hoofdroute controleert de worker de host tegen `agency_domains` en het actieve Agency-plan. Daarna volgt een redirect naar het centrale Agency-dashboard met de verwachte workspace. Het dashboard vergelijkt die met de geauthenticeerde Agency-rol; een account van een andere Agency ziet een toegangsblokkade. Andere paden op de Agency-host leveren 404, zodat privédata en sessies uitsluitend op `portal` bestaan. De Agency-naam blijft na de redirect dus niet in de adresbalk. Een permanent gebrand dashboard op de Agency-host vraagt later aparte sessie- en passkeyarchitectuur.

## Wat al in de code is voorbereid

- Caddy heeft aparte blokken voor hoofddomein en `portal`. Oude privépaden op het hoofddomein krijgen tijdelijk een **302**-redirect; na volledige acceptatie kan die permanent worden. Publieke `/calendar/*.ics` en `/api/paddle/webhook` blijven op het hoofddomein. `portal` heeft `noindex`.
- De belangrijkste publieke login-, registratie- en prijsknoppen openen `portal` rechtstreeks. Private links in nieuwe uitnodigingen, meldingen en mails verwijzen daar ook naartoe. Oude links blijven via de redirect bruikbaar.
- De app corrigeert interne navigatie tussen beide hosts. Contact en status zijn op beide hosts bereikbaar; publieke reislinks blijven op het hoofddomein.
- Nieuwe Agency-instructies tonen `portal.globetrotr.nl` als CNAME-doel. Bestaande CNAMEs naar `dashboard.globetrotr.nl` of `globetrotr.nl` blijven door de verificatie geaccepteerd.
- SQL-migraties 1460 en 1470 voegen handmatige checks toe aan Corporate Admin en reserveren platformhostnamen zoals `portal` voor GlobeTrotr. Geslaagde SQL-tests bewijzen **niet** dat DNS, OAuth, passkeys of tenantisolatie in productie werken.

## Voorbereiding vóór de omschakeling

1. Laat gebruikers openstaande reiswijzigingen opslaan/synchroniseren. De browser bewaart sessie en lokale cache per host: een bestaande login op `globetrotr.nl` verschijnt **niet** automatisch op `portal.globetrotr.nl`. Gebruikers loggen daar eenmaal opnieuw in; kopieer nooit access tokens via URL of gedeelde cookies. Controleer bij offline/onopgeslagen wijzigingen eerst export/synchronisatie.
2. Controleer welke SQL-migraties 1390–1450 al werkelijk in productie staan. Voer uitsluitend ontbrekende migraties in oplopende volgorde uit. Voer daarna migratie en test **1460** uit, vervolgens migratie en test **1470**; de bestandslinks staan in `IMPLEMENTATION_PENDING.md`. Migratie 1470 faalt bewust als een gereserveerde subdomeinnaam al aan een Agency is toegewezen: los dat eerst gericht op. Maak ook een rollbacknotitie van de huidige Supabase Auth URL-instellingen.
3. Controleer de huidige passkey **Relying Party ID** in Supabase. Als die `globetrotr.nl` is, **niet wijzigen**; voeg `https://portal.globetrotr.nl` toe aan de toegestane origins en houd `https://globetrotr.nl` tijdens de overgang. Een wijziging van de RP ID kan bestaande passkeys ongeldig maken. Supabase beperkt het aantal origins; individuele Agency-hosts en eigen domeinen zijn daarom geen schaalbare passkey-loginhosts.

## DNS bij de DNS-provider

Maak een expliciet record `portal` aan. Aanbevolen: `portal.globetrotr.nl CNAME globetrotr.nl` zolang `globetrotr.nl` direct naar het publieke IPv4-adres van Node-01 wijst. Een expliciet `A`-record naar hetzelfde Node-01-adres kan ook. Laat `globetrotr.nl`, `www`, mail-/SMTP-records en de bestaande wildcard voor Agency-subdomeinen staan. Zet **geen** record naar Node-02; die blijft alleen op het private netwerk.

Voor een Agency-subdomein onder `globetrotr.nl` wijst het bestaande wildcard A-record naar Node-01. Voor een klantdomein: `reizen.bedrijf.nl CNAME portal.globetrotr.nl` plus het exacte `TXT _globetrotr.reizen.bedrijf.nl`-token uit Agency-instellingen. DNS-verificatie en certificaat alleen geven nog geen toegang: de nieuwe worker-ingang controleert ook het actieve Agency-plan. Een geproxied CNAME kan de verificatie verbergen; test eerst met directe DNS.

Controleer vanaf je eigen pc of een ander extern netwerk:

```powershell
Resolve-DnsName portal.globetrotr.nl -Type CNAME
Resolve-DnsName portal.globetrotr.nl -Type A
Resolve-DnsName globetrotr.nl -Type A
```

Een provider kan alleen een A-antwoord tonen als hij CNAMEs afvlakt. Controleer dan dat het adres Node-01 is. TCP 80/443 moet op Node-01 bereikbaar zijn voor Caddy-certificaten; geen nieuwe publieke poort op Node-02.

## Supabase Dashboard, Auth en externe dashboards

Doe dit pas wanneer `portal.globetrotr.nl` via HTTPS bereikbaar is, en noteer eerst de oude instellingen:

1. **Authentication → URL Configuration:** Site URL `https://portal.globetrotr.nl`. Voeg exact de gebruikte callback-URL's toe, in ieder geval `https://portal.globetrotr.nl/oauth-callback`, `https://portal.globetrotr.nl/auth`, `https://portal.globetrotr.nl/account` en indien de UI dat nodig heeft de tokenroute. Laat bestaande toegestane `globetrotr.nl`-redirects tijdelijk staan voor al verstuurde mails. Gebruik voor productie zo specifiek mogelijke paden; vertrouw niet alleen op een brede wildcard.
2. **Authentication → Email Templates:** controleer de vijf live templates. `{{ .SiteURL }}/token/{{ .TokenHash }}` wijst na de Site URL-wijziging naar `portal`. De mailafbeelding, contactlink en publieke website blijven op `globetrotr.nl`. Test bevestiging, herstel, magic link, e-mailwijziging en uitnodiging in NL en EN.
3. **Authentication → Passkeys:** behoud de bestaande RP ID `globetrotr.nl` als die nu gebruikt wordt, en voeg `https://portal.globetrotr.nl` als origin toe. Test een **bestaande** passkey én een nieuwe; een geslaagde nieuwe registratie bewijst niet dat oude credentials bruikbaar blijven. MFA/TOTP opnieuw testen op de portalhost.
4. **Google/Discord:** de OAuth-provider-callback blijft normaliter de Supabase Auth-callback van het bestaande project; de app geeft nu `portal` als `redirectTo` door. Controleer de huidige provider- en Supabase-allowlists en test beide flows, inclusief handmatig koppelen en terugkeer naar `/account`.
5. **Cloudflare Turnstile:** voeg `portal.globetrotr.nl` toe aan de toegestane hostnames van de bestaande widget. Behoud het hoofddomein voor het publieke contactformulier. Zonder deze stap kan registratie vastlopen op een onzichtbare spamcontrole.
6. **Paddle:** controleer eventuele domein-/redirect-allowlists en test checkout vanaf `/billing` op `portal`. De checkout-success-URL gebruikt de actuele origin; webhook blijft op `https://globetrotr.nl/api/paddle/webhook`. Verander de webhookbestemming niet zonder een afzonderlijke bezorgtest.
7. **Search Console:** het hoofddomein en zijn openbare sitemap blijven leidend. Het portal krijgt `noindex`; controleer met een HTTP-header. Als je een domeinproperty gebruikt, kan die subdomeinen volgen zonder aparte publieke sitemap.

## Code uitrollen

Commit en push eerst de hele voorbereide release volgens `IMPLEMENTATION_PENDING.md`. Gebruik op beide nodes **dezelfde commit**. Voer daarna uit op **Node-02**:

```bash
cd /opt/globetrotr
git pull --ff-only
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d --build --force-recreate worker mail-relay
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
```

De Node-02-build is nodig voor nieuwe links in meldingen/mail en de Agency-TLS-check uit deze release. Voer daarna uit op **Node-01**:

```bash
cd /opt/globetrotr
git pull --ff-only
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/web.compose.yml run --rm --no-deps --entrypoint caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 caddy web
```

Het Caddy-validatecommando moet zonder fout eindigen voordat je Caddy herstart. Zet de Supabase Site URL pas om nadat de portalhost en de nieuwe webbuild antwoorden. Bestaande mail-links op het hoofddomein worden daarna doorgestuurd.

## Praktijktest vóór brede vrijgave

```bash
curl -I https://globetrotr.nl/
curl -I https://portal.globetrotr.nl/auth
curl -I https://portal.globetrotr.nl/register
curl -I https://globetrotr.nl/account
curl -I https://dashboard.globetrotr.nl/account
curl -I https://portal.globetrotr.nl/
curl -I https://globetrotr.nl/calendar/ongeldige-token.ics
```

Verwacht: homepage 200, portal-auth/register 200, oude privépaden 302 met `Location: https://portal.globetrotr.nl/...`, portal-root 302 naar `/dashboard`, en de ongeldige ICS-token **niet** naar het portal (een 404 van de kalenderworker is daar juist). Controleer `X-Robots-Tag: noindex, nofollow` op portal. Een echte ICS-feed moet 200 + `text/calendar` leveren. Test ook `curl -I https://bedrijf.globetrotr.nl/`: een geregistreerde host met actief Agency-plan krijgt 302 naar `/agency-admin?workspace=...`; onbekende of inactieve hosts krijgen geen toegang, en `/account` op de Agency-host geeft 404.

Voer daarna de Corporate Admin-items `public.portal-hosts`, `auth.portal-cutover`, `agency.domain-tenant-binding` en `agency.portal-entry` uit met echte testaccounts. Test Free/Pro-login, registratie, e-mailbevestiging, recovery, magic link, Google, Discord, passkey, TOTP, uitnodiging, betaling, terugkeer vanaf Paddle, publieke reis, live agenda, contact/status en mobiel menu. Test ook navigatie vanaf een bestaande geopende tab op het hoofddomein. Log op de Agency-ingang eerst uit: je moet op portal kunnen inloggen en na de login bij de bedoelde Agency terechtkomen. Herhaal met een account van een andere Agency en met een verlopen Agency-plan; geen van beide mag de gevraagde workspace zien.

`SMOKE_PORTAL_URL=https://portal.globetrotr.nl npm run smoke` op Linux voert de aanvullende HTTP-controles uit. Doe dit pas nadat de URL bereikbaar is.

## Terugval

Als de portalhost of Auth-callbacks niet goed werken: zet eerst Supabase Site URL en Redirect URLs terug naar hun genoteerde waarden, herstel daarna de vorige Caddy/web/worker-release met een normale nieuwe commit of bekende image (geen force-push), en laat DNS voorlopig staan. De tijdelijke 302-redirect is bewust minder hard gecachet dan een permanente 308. Data en gebruikersaccounts zijn niet gemigreerd; wel blijft de browsercache van beide hosts apart bestaan. Controleer na herstel opnieuw registratie, herstelmail en Paddle-webhook.
