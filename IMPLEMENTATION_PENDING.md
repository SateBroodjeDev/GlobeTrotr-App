# GlobeTrotr — draaiboek voor de volgende release

**Stand:** 21 september 2026

**Huidige stand:** de migraties en tests **tot en met 1320** zijn volgens de eigenaar uitgevoerd. De nieuwe betaaldianose is op de website zichtbaar; de exacte draaiende commit van Node-02 is nog niet bevestigd. De ontbrekende Paddle-transactie faalt aantoonbaar op `billing_transactions_check1` bij 100% korting. Migraties 1330–1340 en hun tests zijn voorbereid, nog niet uitgevoerd. De live ICS-feed blijft een incident tot de praktijktest slaagt.

**Doel:** migraties 1330–1340 testen en uitrollen, daarna de bestaande Paddle-transactie veilig opnieuw verwerken en de live ICS-feed controleren.

Voer de fasen in volgorde uit. Ga bij een fout niet door. Bewaar de volledige foutmelding zonder wachtwoorden, tokens, mailinhoud of persoonsgegevens.

## Voortgang

- [x] Fase 1 — code controleren en releasecommit maken (`47c7db0`)
- [x] Fase 1b — vorige releasecommit naar de gekoppelde branch pushen
- [x] Fase 2 — dertien migraties en SQL-tests uitvoeren
- [x] Fase 2b — vijf Auth-mailtemplates en onderwerpen in Supabase plaatsen
- [ ] Fase 3 — bestaande productieconfiguratie inventariseren; nog geen containers starten
- [x] Fase 4 — vorige release op Node-02 uitrollen
- [x] Fase 5 — vorige release op Node-01 uitrollen
- [x] Herstelronde SQL — migraties 1310–1320 uitvoeren
- [x] Herstelronde SQL-tests 1310–1320 — volgens de eigenaar uitgevoerd
- [x] Herstelronde code — nieuwe betaaldianose op de website zichtbaar; bevestig de Node-02-commit nog bij de webhookcontrole

- [ ] Kortingsherstel SQL — migratie 1330 en `paddle_discounted_totals.sql` uitvoeren

- [ ] Factuur en vooruitbetaalde maanden SQL — migratie 1340 en `paddle_issued_invoices.sql` uitvoeren
- [ ] Fase 6 — kritieke praktijktests uitvoeren
- [ ] Fase 7 — vrijgavebesluit nemen en incidenten bijwerken

Lokaal zijn 79 tests, TypeScript, lint zonder fouten, de securityaudit en de release-preflight groen. De nieuwe productiefunctionaliteit is pas bewezen nadat alle fasen zijn afgerond.

## Fase 1 — Windows: controleren, committen en pushen

De vorige release is volgens de eigenaar al uitgerold. Gebruik voor de huidige herstelronde een nieuwe commit; haal die daarna op beide nodes op. Controleer vooraf:

```powershell
git status --short
git log -2 --oneline
git push
git rev-parse --short HEAD
```

Bewaar de uitvoer van `git rev-parse --short HEAD` als `VERWACHTE_COMMIT`. Verwacht na de nieuwe commit een lege `git status`. Ga niet naar de nodes voordat de push is geslaagd.

De onderstaande uitgebreide controles zijn al uitgevoerd en blijven hier als herhaalbare referentie staan.

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

- `npm run verify`: 79 tests, TypeScript, securityaudit en release-preflight slagen;
- `npm audit`: geen hoge of kritieke productiekwetsbaarheden;
- `git diff --check`: geen uitvoer;
- geen `.env`, wachtwoord, API-sleutel of mailboxcredential in de staged bestanden.

De Windows-Nitrobouw kan aan het einde stranden op `EPERM: readlink C:\Users\info`. De Linux-build op Node-01 en in CI is daarom beslissend. Herschrijf geen gepubliceerde Gitgeschiedenis.

## Fase 2 — Supabase SQL Editor

**Uitgevoerd:** migraties 1180–1300 en hun dertien SQL-tests zijn volgens de eigenaar zonder fout uitgevoerd. Voer deze reeks niet opnieuw uit.

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
|       14 | [1310 — sociaal profiel afronden](supabase/migrations/20260908131000_social_profile_completion.sql)                 | [social_profile_completion.sql](supabase/tests/social_profile_completion.sql)                         |
|       15 | [1320 — €0-Paddle-transacties herstellen](supabase/migrations/20260908132000_zero_discount_billing_repair.sql)         | [zero_discount_billing_repair.sql](supabase/tests/zero_discount_billing_repair.sql)                     |
|       16 | [1330 — Paddle-korting en nettototalen](supabase/migrations/20260908133000_paddle_discounted_totals.sql)            | [paddle_discounted_totals.sql](supabase/tests/paddle_discounted_totals.sql)                             |
|       17 | [1340 — echte Paddle-facturen en gestapelde maanden](supabase/migrations/20260908134000_paddle_issued_invoices.sql)  | [paddle_issued_invoices.sql](supabase/tests/paddle_issued_invoices.sql)                                   |

De tests bewijzen schema, rechten en releasechecklist. Ze vervangen geen echte mail-, betaal- of accounttest. Voer oudere migraties niet opnieuw uit en draai een toegepaste productiemigratie niet handmatig terug.

**Nieuwe productiefix, nog uitvoeren:** voer migratie 1330 uit de tabel hierboven uit en direct daarna de bijbehorende rollback-test. Voer vervolgens migratie 1340 en haar rollback-test uit. De fout `23514: billing_transactions_check1` ontstaat doordat Paddle bij een 100%-korting het bruto subtotaal levert maar de GlobeTrotr-tabel een nettosubtotaal eist. Migratie 1330 normaliseert uitsluitend Paddle-rijen; de originele providerbedragen blijven in de webhookpayload. Migratie 1340 voorkomt dat GlobeTrotr een lokale Paddle-factuur toont voor een €0-transactie of zonder officieel Paddle-factuurnummer; de transactie blijft als betaling zichtbaar. De test verwerkt zes afzonderlijke vooruitbetaalde maanden en verifieert dat een herhaald event geen zevende maand toevoegt. Migraties 1310–1320 hoef je niet opnieuw te draaien. Voor de SQL-fix is geen containerherstart nodig; de melding over €0-facturen en de zichtbare einddatum van vooruitbetaalde toegang op de website vereisen wel een nieuwe Node-01-build.

**Daarna:** open Corporate Admin → Financiën, diagnoseer `txn_01m3266ap61fdket5ft38ax5de` en kies **Bij Paddle controleren en herstellen** met een reden. Controleer daarna de lokale €0-transactie, het juiste Agency-plan en de einddatum. Paddle biedt voor €0 geen factuur-PDF; GlobeTrotr mag dan geen lokale Paddle-factuur tonen. Controleer óók in Paddle de HTTP-status van notificatie `ntf_01m3267edg27hm2e7jkn3q5fqb` en of een nieuwe bezorgpoging `200` krijgt; de handmatige herstelactie alleen verhelpt toekomstige webhookfouten niet. Pas daarna een nieuwe live ICS-feed maken en met GET/HEAD en een agenda-app testen.

### Gerichte productiecontrole na deze deploy

1. Open `https://globetrotr.nl/updates` direct en klik in de footer op **Publieke changelog**. Test NL en EN.
2. Open op telefoon en desktop een bedrijfsmail met lange onderwerpregel, adressen en HTML. De pagina mag horizontaal niet uit het scherm lopen.
3. Open `/register` in een privévenster. De spamcontrole moet verschijnen of na ongeveer 15 seconden een zichtbare fout plus **Opnieuw laden** tonen. Test een nieuwe registratie en wacht maximaal 25 seconden op een duidelijke uitkomst. Bij een timeout eerst de inbox en Supabase Auth Users controleren vóór opnieuw proberen; de backend kan de aanvraag nog afronden.
4. Gebruik op de registratiepagina een adres dat al via Google bestaat. De UI verwijst naar aanmelden via Google/Discord zonder prijs te geven of een adres al geregistreerd is. Supabase kan bij bevestigde adressen opzettelijk een schijnbaar geslaagd antwoord teruggeven; dit is geen bewijs van een tweede account.
5. Maak een nieuw Google- of Discord-account. Na OAuth moet eenmalig `/complete-profile` verschijnen; sla naam, optionele telefoon en foto op. Een volgende login mag dit scherm niet opnieuw tonen. Controleer ook dat het koppelen van een provider aan een bestaand account via `/account` rechtstreeks naar `/account` teruggaat.
6. Maak met een betaald account een nieuwe live agenda-URL. Node-01 controleert voortaan zelf of de publieke URL daadwerkelijk `200`, `text/calendar` en `BEGIN:VCALENDAR` levert voordat hij de link toont. Test daarna met een agenda-app en, zonder de geheime link te delen, `curl -i 'https://globetrotr.nl/calendar/<token>.ics'` en `curl -I 'https://globetrotr.nl/calendar/<token>.ics'`. Beide moeten `200` en `Content-Type: text/calendar` geven. Een 404 op een bestaande link betekent dat de token is ingetrokken of dat de workspace volgens de database geen actief Pro/Agency-plan heeft. Controleer dan eerst Paddle-toegang en de workerlog (`calendar.feed_unavailable`), daarna de Caddy-route naar Node-02.
7. Voor de ontbrekende Paddle-transactie `txn_01m3266ap61fdket5ft38ax5de`: volg de webhookcontrole hieronder. Migratie 1320 voorkomt dat `credit=0` en `total=0` als volledige terugbetaling gelden. Controleer op Node-02 of de worker een legacy service-role JWT of een `sb_secret_`-sleutel gebruikt; beide worden na deze uitrol correct als Supabase-credential verstuurd. Een voltooide €0-transactie bij Paddle is nog geen bewezen gekoppeld abonnement. Houd dit incident open tot de bezorging en workspacekoppeling zijn bevestigd.

   Als na de uitrol nog geen lokale transactie bestaat, open **Corporate Admin → Financiën → Betaling en account controleren**, vul exact dat transactie-ID in en kies **Bij Paddle controleren en herstellen**. Deze actie vereist op Node-01 een Paddle API-sleutel met `transaction.read` én `adjustment.read`. Zij weigert transacties die niet voltooid zijn, een onbekend prijs-ID hebben, geen geldige ondertekende workspacekoppeling bevatten, al lokaal bestaan of een refund/credit/chargeback hebben. Deel de Paddle API-sleutel nooit in de browser of in een screenshot. Controleer daarna het juiste account, plan, €0-betaalregel zonder PDF en de live ICS-feed. De actie vervangt niet de webhookdiagnose voor toekomstige betalingen.

**Bij een nieuwe registratie-504:** noteer het exacte tijdstip en controleer in Supabase **Logs → Auth** de aanvraag rond dat tijdstip. Controleer of er een gebruiker is aangemaakt in **Authentication → Users** en of de bevestigingsmail in de SMTP-log is aangeboden of geweigerd. Een browser-timeout maakt de serveraanvraag niet ongedaan; probeer niet blind hetzelfde adres opnieuw. De huidige UI begrenst alleen de wachttijd, de Auth/SMTP-storing zelf vergt de serverlog om gericht te verhelpen.

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

**Uitgevoerd:** Confirm signup, Reset password, Change email address, Magic link en Invite user plus de conditionele onderwerpen zijn volgens de eigenaar geplaatst.

Na migratie 1300 open je in het Supabase Dashboard **Authentication → Email Templates**. Vervang daar de inhoud van Confirm signup, Reset password, Change email address, Magic link en Invite user door de gelijknamige bestanden uit `supabase/templates`. Neem per type ook het conditionele onderwerp uit `supabase/templates/subjects.md` over. De templates gebruiken `user_metadata.language`; Nederlands wordt alleen gekozen bij `nl`, anders blijft Engels de veilige standaard.

Controleer dat de Site URL `https://globetrotr.nl` is en dat de toegestane redirects de eigen `/auth`- en `/token/...`-routes niet blokkeren. Deze Dashboard-stap wordt niet door een Git-push uitgevoerd.

### Optioneel: gratis NL/EN-vertaalconcepten

Configureer of start dit hier nog niet. De translation-service staat pas in `deploy/worker.compose.yml` nadat Node-02 in fase 4 de nieuwe commit heeft opgehaald. De exacte installatie staat daarom bij fase 4. Vertalingen blijven handmatig te controleren concepten; gebruik ze niet voor juridische tekst.

## Fase 4 — Node-02 eerst uitrollen

### 4.1 Nieuwe code ophalen

```bash
cd /opt/globetrotr
git pull --ff-only
git log -1 --oneline
```

De laatste regel moet dezelfde `VERWACHTE_COMMIT` tonen als op je pc. Controleer nu pas of het nieuwe translation-profiel bestaat:

```bash
grep -n "translation:" deploy/worker.compose.yml
```

### 4.2 Node-02 configureren

Open na de pull het bestaande secretbestand:

```bash
nano /opt/globetrotr/.env.production
```

Controleer de bestaande waarden uit fase 3 en voeg voor vertaling toe:

```dotenv
TRANSLATION_BIND_ADDRESS=10.0.0.3
```

Open poort 5000 niet voor internet. Zoek eerst het private IP van Node-01 en de private interface van Node-02:

```bash
ip -4 address
```

Vervang hieronder `10.0.0.X` door het private IP van Node-01 en `PRIVATE_INTERFACE` door de interface waarop Node-02 `10.0.0.3` heeft:

```bash
sudo ufw allow in on PRIVATE_INTERFACE from 10.0.0.X to 10.0.0.3 port 5000 proto tcp comment 'LibreTranslate vanaf Node-01'
sudo ufw status numbered
```

Voeg in de providerfirewall van Node-02 eveneens alleen TCP 5000 vanaf het private IP van Node-01 toe. Gebruik niet `Any IPv4` of `Any IPv6`.

### 4.3 Node-02 bouwen en starten

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation config --quiet
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d --build
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation ps
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation logs --tail=150 worker imap-sync mail-relay clamav translation
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

### 5.1 Nieuwe code ophalen

```bash
cd /opt/globetrotr
git pull --ff-only
git log -1 --oneline
```

De laatste regel moet dezelfde `VERWACHTE_COMMIT` tonen als op je pc.

### 5.2 Node-01 met Node-02 verbinden

Open het bestaande secretbestand:

```bash
nano /opt/globetrotr/.env.production
```

Voeg toe:

```dotenv
TRANSLATION_API_URL=http://10.0.0.3:5000/translate
TRANSLATION_API_KEY=
```

Een lege API-key is correct omdat de dienst uitsluitend via het private netwerk bereikbaar is. Test de verbinding vóór de webbuild:

```bash
curl --fail http://10.0.0.3:9091/health
curl --fail http://10.0.0.3:5000/languages
curl --fail --request POST http://10.0.0.3:5000/translate \
  --header 'Content-Type: application/json' \
  --data '{"q":"Uw reis is bijgewerkt.","source":"nl","target":"en","format":"text"}'
```

### 5.3 Node-01 bouwen en starten

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/web.compose.yml config --quiet
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=150 web caddy
npm run smoke
```

`web` en `caddy` moeten gezond zijn. De smoketest controleert homepage, registratie, login, status, contact, roadmap, updates en publieke logo’s. Open daarna `https://globetrotr.nl` in een privévenster.

## Fase 6 — kritieke praktijktests

### Als Paddle een voltooide transactie toont maar Corporate Admin niets vindt

Een 100%-kortingscode kan een voltooide Paddle-transactie van €0 opleveren. Dat is geen bewijs dat GlobeTrotr de webhook heeft verwerkt. Controleer eerst de bezorging; geef het account niet handmatig een betaald plan voordat de bron en workspacekoppeling zijn vastgesteld.

Open in **Paddle → Developer tools → Notifications** de bestemming voor `https://globetrotr.nl/api/paddle/webhook`. Controleer of `transaction.completed` is geselecteerd en zoek de bezorgpoging voor het exacte transactie-ID. Noteer tijdstip, HTTP-status en eventuele foutcode; deel geen volledige webhookpayload of ondertekeningssecret.

Controleer op **Node-02** zonder geheimen af te drukken of de vier prijs-ID's en het checkoutgeheim daadwerkelijk aanwezig zijn in de draaiende worker:

```bash
cd /opt/globetrotr
docker compose --env-file .env.production -f deploy/worker.compose.yml exec worker node -e 'for (const k of ["VITE_PADDLE_PRO_MONTHLY_PRICE_ID","VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID","VITE_PADDLE_PRO_ONETIME_PRICE_ID","VITE_PADDLE_AGENCY_ONETIME_PRICE_ID","PADDLE_CHECKOUT_BINDING_SECRET","PADDLE_WEBHOOK_SECRET"]) console.log(k, Boolean(process.env[k]?.trim()))'
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --since=2h worker | grep -E 'paddle.webhook|paddle.webhook_failed'
```

Alle zes regels moeten `true` tonen. Het **Agency one-time** price-ID in de worker moet exact het price-ID van de Paddle-transactie zijn; controleer dat desnoods met een booleaanse vergelijking zonder de waarde te tonen:

```bash
docker compose --env-file .env.production -f deploy/worker.compose.yml exec worker node -e 'console.log("Agency one-time ID configured:", /^pri_[a-z0-9]+$/i.test(process.env.VITE_PADDLE_AGENCY_ONETIME_PRICE_ID ?? ""))'
```

Deze laatste syntaxiscontrole bewijst nog geen gelijkheid met Paddle. Vergelijk het ID in Paddle met het ID in de private `.env.production` op Node-02, zonder het hier of in logs te plakken. Controleer ook dat `PADDLE_CHECKOUT_BINDING_SECRET` op Node-01 en Node-02 gelijk is; print of kopieer het geheim niet naar een chat.

Voer in de **Supabase SQL Editor** alleen deze leesquery uit en vervang het voorbeeld-ID door het transactie-ID:

```sql
SELECT provider_event_id, event_type, status, last_error_code, received_at, processed_at,
       payload->'data'->>'globetrotr_plan' AS recognized_plan,
       payload->'data'->>'globetrotr_billing_mode' AS recognized_mode,
       NULLIF(payload->'data'->'custom_data'->>'workspace_uuid','') IS NOT NULL AS workspace_bound
FROM public.billing_webhook_events
WHERE payload->'data'->>'id' = 'txn_REPLACE_ME'
ORDER BY received_at DESC;

SELECT provider_transaction_id, status, total_minor
FROM public.billing_transactions
WHERE provider_transaction_id = 'txn_REPLACE_ME';
```

- Geen webhookrij: Paddle heeft het event niet aan de juiste bestemming afgeleverd, of Node-01/Caddy heeft het niet doorgestuurd. Controleer bestemming, eventselectie, HTTP-status, Caddy en workerlogs.
- `ignored` met `WORKSPACE_NOT_FOUND`: controleer de juiste one-time price-ID op Node-02 en hetzelfde checkoutgeheim op beide nodes. Een verkeerde prijs of handtekening maakt de workspacekoppeling ongeldig.
- `failed`: noteer `last_error_code` en gebruik de gecontroleerde herverwerking in Corporate Admin pas nadat de oorzaak is opgelost.
- `processed` maar geen transactie: onderzoek de opgeslagen eventgegevens en databasefunctie; voer geen handmatige planupdate uit.

Een afwezig webhookrecord wordt in de diagnose als **onbekende betaalwijze** getoond. De eerdere weergave “recurring” was slechts een onjuiste fallback. Houd het incident open tot dezelfde transactie, het juiste Agency-recht en de vervaldatum lokaal zichtbaar zijn.

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
