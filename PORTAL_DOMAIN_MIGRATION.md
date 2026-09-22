# Domeinscheiding: website, portal en Agency

**Basis actief sinds 22 september 2026.** Release `5df0590`, DNS, HTTPS en de centrale portal zijn uitgerold. Alleen de aanvullende navigatiecorrectie en checklistmigratie 1480 staan nog klaar voor de eerstvolgende kleine uitrol. De applicatie blijft één webbuild; Caddy en de app kiezen op basis van de host de juiste ingang. De database en accounts verhuizen niet.

| Host | Doel | Status na deze code-uitrol |
| --- | --- | --- |
| `globetrotr.nl` | Homepage, demo, prijzen, contact, status, privacy, openbare reizen en agenda-feed | Publieke site |
| `portal.globetrotr.nl` | Registratie, login, dashboard, reizen, account, betaling, Agency- en Corporate Admin | Centrale portalingang voor Free, Pro en Agency |
| `dashboard.globetrotr.nl` | Oude links | Redirect naar `portal` met pad |
| `bedrijf.globetrotr.nl` | Agency-ingang | De geregistreerde actieve host stuurt door naar het centrale Agency-dashboard met een workspacecontrole. Login blijft op `portal`. |
| `reizen.bedrijf.nl` | Eigen Agency-domein | Na CNAME/TXT-verificatie en actief Agency-plan dezelfde gecontroleerde doorverwijzing. |

Een Agency-host is nu een **eigen ingang**, geen aparte app-origin. Bij bezoek aan de hoofdroute controleert de worker de host tegen `agency_domains` en het actieve Agency-plan. Daarna volgt een redirect naar het centrale Agency-dashboard met de verwachte workspace. Het dashboard vergelijkt die met de geauthenticeerde Agency-rol; een account van een andere Agency ziet een toegangsblokkade. Andere paden op de Agency-host leveren 404, zodat privédata en sessies uitsluitend op `portal` bestaan. De Agency-naam blijft na de redirect dus niet in de adresbalk. Een permanent gebrand dashboard op de Agency-host vraagt later aparte sessie- en passkeyarchitectuur.

## Actieve architectuur

- Caddy heeft aparte blokken voor hoofddomein en `portal`. Oude privépaden op het hoofddomein krijgen tijdelijk een **302**-redirect; na volledige acceptatie kan die permanent worden. Publieke `/calendar/*.ics` en `/api/paddle/webhook` blijven op het hoofddomein. `portal` heeft `noindex`.
- Vanaf het portal openen logo, Website/Home en publieke menu- en footerlinks rechtstreeks de website. Publieke routes die iemand toch direct onder `portal` bezoekt, worden door Caddy naar het hoofddomein gestuurd; `contact` en `status` blijven ook vanuit een ingelogd account bereikbaar.
- De belangrijkste publieke login-, registratie- en prijsknoppen openen `portal` rechtstreeks. Private links in nieuwe uitnodigingen, meldingen en mails verwijzen daar ook naartoe. Oude links blijven via de redirect bruikbaar.
- De app corrigeert interne navigatie tussen beide hosts. Contact en status zijn op beide hosts bereikbaar; publieke reislinks blijven op het hoofddomein.
- Nieuwe Agency-instructies tonen `portal.globetrotr.nl` als CNAME-doel. Bestaande CNAMEs naar `dashboard.globetrotr.nl` of `globetrotr.nl` blijven door de verificatie geaccepteerd.
- SQL-migraties 1460 en 1470 zijn uitgevoerd. Ze voegen handmatige checks toe aan Corporate Admin en reserveren platformhostnamen zoals `portal` voor GlobeTrotr. Geslaagde SQL-tests bewijzen **niet** dat DNS, OAuth, passkeys of tenantisolatie in productie werken.

## Reeds uitgevoerde omschakeling

DNS, HTTPS, de portalbuild en migraties/tests tot en met 1470 zijn uitgevoerd. Herhaal die migraties niet. De browser bewaart sessie en lokale cache per host: een login op `globetrotr.nl` verschijnt niet automatisch op `portal.globetrotr.nl`. Kopieer daarom nooit access tokens via URL of gedeelde cookies. De passkey-RP-ID blijft `globetrotr.nl`; de portalhost hoort als toegestane origin ingesteld te zijn. Controleer een bestaande en een nieuwe passkey tijdens de acceptatietest.

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

## Volgende correctie uitrollen

Voor de nog open navigatiecorrectie voer je alleen migratie/test 1480 uit en bouw je Node-01 opnieuw. Node-02 wijzigt niet. De volledige volgorde staat in `IMPLEMENTATION_PENDING.md`. Na commit en push voer je op Node-01 uit:

```bash
cd /opt/globetrotr
git pull --ff-only
git rev-parse --short HEAD
docker compose --env-file .env.production -f deploy/web.compose.yml run --rm --no-deps --entrypoint caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web caddy
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 caddy web
```

Het Caddy-validatecommando moet zonder fout eindigen voordat je Caddy herstart. De Supabase Site URL staat al op de portalhost en hoeft voor deze correctie niet te veranderen.

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
