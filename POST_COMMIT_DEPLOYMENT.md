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

Open Supabase Dashboard → **Database → Migrations**. Controleer welke versies vanaf `20260908100000` al geregistreerd zijn. Voer alleen ontbrekende migraties uit, altijd in deze volgorde:

1. `supabase/migrations/20260908100000_account_communication_preferences.sql`
2. `supabase/migrations/20260908101000_direct_invitation_email.sql`
3. `supabase/migrations/20260908102000_email_template_acceptance.sql`
4. `supabase/migrations/20260908103000_social_login_acceptance.sql`
5. `supabase/migrations/20260908104000_passwordless_auth_acceptance.sql`
6. `supabase/migrations/20260908105000_identity_and_mail_delivery_management.sql`
7. `supabase/migrations/20260908106000_mail_delivery_mode_acceptance.sql`
8. `supabase/migrations/20260908107000_worker_claim_recovery.sql`
9. `supabase/migrations/20260908108000_production_privacy_acceptance.sql`

Gebruik bij handmatige uitvoering voor ieder bestand afzonderlijk Supabase Dashboard → **SQL Editor → New query**:

1. Open het bestand lokaal in VS Code.
2. Kopieer de volledige inhoud.
3. Plak die in een lege Supabase-query.
4. Kies **Run**.
5. Ga alleen verder wanneer er geen foutmelding staat.

Voer daarna op dezelfde manier deze tests uit. Ze wijzigen geen blijvende testdata:

1. `supabase/tests/account_communication_preferences.sql`
2. `supabase/tests/direct_invitation_email.sql`
3. `supabase/tests/email_template_acceptance.sql`
4. `supabase/tests/social_login_acceptance.sql`
5. `supabase/tests/passwordless_auth_acceptance.sql`
6. `supabase/tests/identity_and_mail_delivery_management.sql`
7. `supabase/tests/mail_delivery_mode_acceptance.sql`
8. `supabase/tests/worker_claim_recovery.sql`
9. `supabase/tests/production_privacy_acceptance.sql`

Stop bij een SQL-fout en bewaar de volledige foutmelding. Zet de bezorgmodus nog niet op live voordat Node-02 opnieuw is gebouwd en de relaytest HTTP `202` geeft.

## 3. Supabase Auth instellen

Controleer in Supabase Dashboard → **Authentication → URL Configuration**:

- Site URL: `https://globetrotr.nl`
- Redirect toegestaan: `https://globetrotr.nl/**`
- Eventuele Agency-subdomeinen pas toevoegen nadat hun routing werkt.

Controleer daarna:

- Custom SMTP en de templates uit `supabase/templates`.
- Google, Facebook en Discord volgens `OAUTH_SETUP.md`.
- Handmatig koppelen van identiteiten, zodat een ingelogde gebruiker providers vanuit Account kan koppelen.
- Passkeys ingeschakeld voor het productieproject.

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

Beide containers moeten `healthy` zijn. Poorten `9091` en `9092` mogen niet publiek bereikbaar zijn.

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

## 7. Praktische acceptatie

Doorloop in **Corporate Admin → Releasecheck** minstens deze nieuwe groepen:

- Google, Facebook en Discord koppelen en veilig ontkoppelen.
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
- Inkomende bedrijfsmail via IMAP of een mailprovider-API; SMTP verzorgt nu alleen verzending.
- Externe monitoring, volledige back-upherstelproef en de finale securityscan.
