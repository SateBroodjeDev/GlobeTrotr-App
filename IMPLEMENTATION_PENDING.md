# GlobeTrotr — draaiboek voor de volgende release

**Stand:** 21 september 2026

**Startpunt:** productie heeft migraties en SQL-tests tot en met 1170

**Doel:** wijzigingen 1180–1300 gecontroleerd migreren, beide nodes uitrollen en de kritieke productstromen testen.

Voer de fasen in volgorde uit. Ga bij een fout niet door. Bewaar de volledige foutmelding zonder wachtwoorden, tokens, mailinhoud of persoonsgegevens.

## Voortgang

- [ ] Fase 1 — code controleren, committen en pushen
- [ ] Fase 2 — dertien migraties en SQL-tests uitvoeren
- [ ] Fase 3 — productiegeheimen en optionele vertaling configureren
- [ ] Fase 4 — Node-02 uitrollen en gezond verklaren
- [ ] Fase 5 — Node-01 uitrollen en smoketest uitvoeren
- [ ] Fase 6 — kritieke praktijktests uitvoeren
- [ ] Fase 7 — vrijgavebesluit nemen en incidenten bijwerken

Lokaal zijn 78 tests, TypeScript, lint zonder fouten, de securityaudit en de release-preflight groen. De nieuwe productiefunctionaliteit is pas bewezen nadat alle fasen zijn afgerond.

## Fase 1 — Windows: controleren, committen en pushen

Voer dit uit in de projectmap:

```powershell
git status --short
npm run verify
npm audit --omit=dev --audit-level=high
git -c core.safecrlf=false diff --check
git add -A
git diff --cached --name-only
git commit -m "Improve mail, billing and release reliability"
git push
```

Verwacht:

- `npm run verify`: 78 tests, TypeScript, securityaudit en release-preflight slagen;
- `npm audit`: geen hoge of kritieke productiekwetsbaarheden;
- `git diff --check`: geen uitvoer;
- geen `.env`, wachtwoord, API-sleutel of mailboxcredential in de staged bestanden.

De Windows-Nitrobouw kan aan het einde stranden op `EPERM: readlink C:\Users\info`. De Linux-build op Node-01 en in CI is daarom beslissend. Herschrijf geen gepubliceerde Gitgeschiedenis.

## Fase 2 — Supabase SQL Editor

Open de SQL Editor van het productieproject. Voer steeds eerst de migratie en direct daarna de test uit. Iedere test moet zonder fout eindigen voordat je doorgaat.

| Volgorde | Migratie                                                                                                            | Test                                                                                                  |
| -------: | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
|        1 | [1180 — betrouwbaarheid mail en betaling](supabase/migrations/20260908118000_beta_mail_and_billing_reliability.sql) | [beta_mail_and_billing_reliability.sql](supabase/tests/beta_mail_and_billing_reliability.sql)         |
|        2 | [1190 — bedrijfsmailwerkplek](supabase/migrations/20260908119000_corporate_mail_workspace.sql)                      | [corporate_mail_workspace.sql](supabase/tests/corporate_mail_workspace.sql)                           |
|        3 | [1200 — mailgesprekken](supabase/migrations/20260908120000_corporate_mail_threads.sql)                              | [corporate_mail_threads.sql](supabase/tests/corporate_mail_threads.sql)                               |
|        4 | [1210 — mailbijlagen](supabase/migrations/20260908121000_corporate_mail_attachments.sql)                            | [corporate_mail_attachments.sql](supabase/tests/corporate_mail_attachments.sql)                       |
|        5 | [1220 — afgebroken uploads opruimen](supabase/migrations/20260908122000_corporate_mail_upload_cleanup.sql)          | [corporate_mail_upload_cleanup.sql](supabase/tests/corporate_mail_upload_cleanup.sql)                 |
|        6 | [1230 — malwarescan](supabase/migrations/20260908123000_corporate_mail_malware_acceptance.sql)                      | [corporate_mail_malware_acceptance.sql](supabase/tests/corporate_mail_malware_acceptance.sql)         |
|        7 | [1240 — privacycontrole mail](supabase/migrations/20260908124000_privacy_mail_acceptance.sql)                       | [privacy_mail_acceptance.sql](supabase/tests/privacy_mail_acceptance.sql)                             |
|        8 | [1250 — postvakdiagnose](supabase/migrations/20260908125000_mailbox_sync_diagnostics.sql)                           | [mailbox_sync_diagnostics.sql](supabase/tests/mailbox_sync_diagnostics.sql)                           |
|        9 | [1260 — Paddle-accountdiagnose](supabase/migrations/20260908126000_paddle_account_diagnostics_acceptance.sql)       | [paddle_account_diagnostics_acceptance.sql](supabase/tests/paddle_account_diagnostics_acceptance.sql) |
|       10 | [1270 — Agency-klantregistratie](supabase/migrations/20260908127000_agency_client_registration_link.sql)            | [agency_client_registration_link.sql](supabase/tests/agency_client_registration_link.sql)             |
|       11 | [1280 — ondertekende Paddle-checkout](supabase/migrations/20260908128000_paddle_checkout_binding_acceptance.sql)    | [paddle_checkout_binding_acceptance.sql](supabase/tests/paddle_checkout_binding_acceptance.sql)       |
|       12 | [1290 — gelokaliseerde platformmail](supabase/migrations/20260908129000_localized_platform_service_mail.sql)        | [localized_platform_service_mail.sql](supabase/tests/localized_platform_service_mail.sql)             |
|       13 | [1300 — taalkeuze voor Auth-mail](supabase/migrations/20260908130000_auth_email_locale.sql)                         | [auth_email_locale.sql](supabase/tests/auth_email_locale.sql)                                         |

De tests bewijzen schema, rechten en releasechecklist. Ze vervangen geen echte mail-, betaal- of accounttest. Voer oudere migraties niet opnieuw uit en draai een toegepaste productiemigratie niet handmatig terug.

## Fase 3 — configuratie vóór de containers starten

### Op beide nodes

Controleer in `/opt/globetrotr/.env.production` dezelfde vier Paddle-price-ID’s:

```dotenv
VITE_PADDLE_PRO_MONTHLY_PRICE_ID=pri_...
VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_...
VITE_PADDLE_PRO_ONETIME_PRICE_ID=pri_...
VITE_PADDLE_AGENCY_ONETIME_PRICE_ID=pri_...
```

Maak eenmaal een checkoutgeheim met `openssl rand -hex 32`. Zet exact dezelfde uitvoer op Node-01 en Node-02:

```dotenv
PADDLE_CHECKOUT_BINDING_SECRET=<64-hex-tekens>
```

### Alleen Node-02

Controleer de bestaande Supabase-serviceconfiguratie, Paddle API/webhook, SMTP/IMAP, relaytoken en mailboxsleutel. Voeg voor de private bijlagenscanner toe:

```dotenv
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=30000
```

Open poort 3310 niet in UFW of de providerfirewall.

### Supabase Auth-templates

Na migratie 1300 open je in het Supabase Dashboard **Authentication → Email Templates**. Vervang daar de inhoud van Confirm signup, Reset password, Change email address, Magic link en Invite user door de gelijknamige bestanden uit `supabase/templates`. Neem per type ook het conditionele onderwerp uit `supabase/templates/subjects.md` over. De templates gebruiken `user_metadata.language`; Nederlands wordt alleen gekozen bij `nl`, anders blijft Engels de veilige standaard.

Controleer dat de Site URL `https://globetrotr.nl` is en dat de toegestane redirects de eigen `/auth`- en `/token/...`-routes niet blokkeren. Deze Dashboard-stap wordt niet door een Git-push uitgevoerd.

### Optioneel: gratis NL/EN-vertaalconcepten

Zet op Node-02 `TRANSLATION_BIND_ADDRESS=10.0.0.3`. Zet op Node-01:

```dotenv
TRANSLATION_API_URL=http://10.0.0.3:5000/translate
TRANSLATION_API_KEY=
```

Sta TCP 5000 uitsluitend toe van Node-01 naar het private IP van Node-02. Vertalingen blijven handmatig te controleren concepten; gebruik ze niet voor juridische tekst.

## Fase 4 — Node-02 eerst uitrollen

```bash
cd /opt/globetrotr
git pull --ff-only
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d --build
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=150 worker imap-sync mail-relay clamav
curl --fail http://127.0.0.1:9091/health
```

Laat `--profile translation` weg als je vertaling nog niet activeert. Wacht bij de eerste ClamAV-start op de virusdefinities. Ga pas verder wanneer `worker`, `imap-sync`, `mail-relay` en `clamav` draaien en de workerhealth groen is.

Test een actieve vertaalservice met:

```bash
curl --fail http://10.0.0.3:5000/languages
curl --fail --request POST http://10.0.0.3:5000/translate \
  --header 'Content-Type: application/json' \
  --data '{"q":"Goede reis","source":"nl","target":"en","format":"text"}'
```

## Fase 5 — Node-01 uitrollen

```bash
cd /opt/globetrotr
git pull --ff-only
curl --fail http://10.0.0.3:9091/health
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=150 web caddy
npm run smoke
```

`web` en `caddy` moeten gezond zijn. De smoketest controleert homepage, registratie, login, status, contact, roadmap, updates en publieke logo’s. Open daarna `https://globetrotr.nl` in een privévenster.

## Fase 6 — kritieke praktijktests

Gebruik een Corporate Admin, Agency-beheerder, Agency-klant en twee normale accounts. Test minstens één Nederlands en één Engels profiel.

### P0 — moet slagen vóór vrijgave

- [ ] Registratie, bevestiging, login, herstelmail, magic link, Google, Discord, passkey en TOTP.
- [ ] Confirm signup, herstel, magic link, e-mailwijziging en Auth-uitnodiging ieder eenmaal met een Nederlands en Engels profiel; onderwerp én inhoud gebruiken precies één taal.
- [ ] Eén reisuitnodiging geeft precies één verzorgde e-mail, één in-appmelding en een werkende link.
- [ ] Kritieke storing en herstel geven nette NL/EN HTML-mail en leesbare pop-uptekst.
- [ ] Pro en Agency: maandelijks en eenmalig betalen; juiste workspace, plan, factuur, opzegging, verval en refund.
- [ ] Webhookherhaling geeft geen dubbel recht; een gewijzigde browser-workspace-ID geeft geen toegang.
- [ ] Persoonlijk en gedeeld postvak koppelen; HTML-mail met handtekening heen en terug sturen.
- [ ] Inbox, Verzonden, Concepten, Wachtrij, Archief, zoeken, gespreksthread en veilige HTML-weergave.
- [ ] PDF en afbeelding verzenden en ontvangen; EICAR en uitgeschakelde ClamAV blokkeren zonder inhoud te loggen.
- [ ] Agency-klant vóór registratie koppelen; na bevestiging alleen de bedoelde reis en na archiveren geen toegang.
- [ ] GPX openen; losse ICS en live agenda importeren, reis wijzigen, verversen en link intrekken.
- [ ] Publieke reis toont een leesbare dagindeling zonder prijzen, boekingsnummers, notities of andere privévelden.
- [ ] Corporate Admin-releasecheck uitvoeren; geen kritieke of hoge securitybevinding open laten.

### P1 — direct daarna controleren

- [ ] Reis maken; meerdere velden tegelijk wijzigen; planning, boeking, activiteit, taak, document en uitgave beheren.
- [ ] Lange betalersnamen op 320 en 375 pixels zonder overlap.
- [ ] Agency-team, rollen, offerte maken/delen/beantwoorden/omzetten, branding en eigen domein.
- [ ] Bedrijfsbeheerder maken, rechten en mailbox wijzigen, opnieuw inloggen en opslag controleren.
- [ ] Privacyverzoek indienen, beantwoorden en de melding ontvangen.
- [ ] Home, demo, prijzen, contact, status, roadmap, updates, juridische pagina’s, cookies, talen en onderhoud op telefoon en desktop.

Leg iedere afwijking vast met rol, route, apparaat of mailclient, tijdstip en verwacht versus werkelijk gedrag. Deel alleen gemaskeerde Paddle-ID’s en nooit secrets of klantinhoud.

## Fase 7 — vrijgavebesluit

Vrijgeven mag alleen wanneer:

- alle dertien migraties en tests zijn geslaagd;
- Node-01 en Node-02 gezond zijn en `npm run smoke` slaagt;
- alle P0-tests en nieuwe Corporate Admin-controles zijn afgevinkt;
- Paddle-rechten, uitnodigingsmail, bedrijfsmail, Agency-klanttoegang, GPX en agenda echt werken;
- geen kritisch of hoog beveiligingsprobleem openstaat.

Zet incidenten pas op **Opgelost** na een geslaagde praktijktest. Openstaande incidenten zijn: dubbele of kale servicemail, verkeerde mailtaal, bedrijfsbeheerder opslaan, Agency-klantkoppeling, GPX, Paddle-rechten, iCal-activiteiten of 404, platte bedrijfsmail, lange publieke deelpagina en overlappende betalersnaam.

Bij een fout na uitrol: stop nieuwe tests, bewaar logs zonder persoonsgegevens en herstel met een nieuwe commit en zo nodig een nieuwe voorwaartse migratie. Gebruik geen force-push en draai geen toegepaste productiemigratie handmatig terug.

Voor een volledig nieuwe serverinstallatie gebruik je [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md). Voor een nieuw leeg Supabase-project gebruik je [SUPABASE_PRODUCTION_MIGRATION.md](SUPABASE_PRODUCTION_MIGRATION.md). Voor overige acceptatiescenario’s gebruik je [TEST_CHECKLIST.md](TEST_CHECKLIST.md).
