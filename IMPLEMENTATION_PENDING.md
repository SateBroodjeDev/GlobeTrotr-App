# GlobeTrotr â€” draaiboek voor de volgende release

**Stand:** 22 september 2026

**Nieuwe domeinscheiding (nog niet uitgerold):** volg na de normale release [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md). Deze beschrijft de exacte volgorde voor DNS, Node-01/02, Supabase Site URL, Turnstile, OAuth en passkeys. Een geregistreerde Agency-host wordt gecontroleerd en stuurt naar het centrale Agency-dashboard; een blijvend dashboard op de Agency-host is bewust geen onderdeel van deze release. Zet de Auth Site URL niet voortijdig om.

**SQL-test 1430 `ACCOUNT_UI_SIGNATURE_ACCEPTANCE_MISSING`:** de oorspronkelijke migratie 1430 leverde per checklistregel geen `label_en` terwijl die kolom wel in de `INSERT` stond. De transactie is daardoor niet toegepast. De migratie is in deze werkboom hersteld; voer de **volledige actuele migratie 1430** opnieuw uit in Supabase SQL Editor en direct daarna de test 1430. De migratie gebruikt `ON CONFLICT DO UPDATE` en is herhaalbaar. Controleer vervolgens migratie/test 1440 en ga pas daarna verder met 1450–1470. Een mislukte test alleen repareert niets.

**Publieke vrijgave:** begin met [PRE_RELEASE.md](PRE_RELEASE.md) voor de korte beslislijst van pagina's, privacy, betalingen en Agency-DNS. Dit document blijft het uitvoerdraaiboek. Nieuw in deze codebatch: migratie en test `20260908145000_public_launch_and_agency_dns_acceptance.sql`, een webbuild op Node-01 en een workerbuild op Node-02 voor de TLS-toelating. De werkelijke Supabase-status van 1390–1440 is nog niet volledig bevestigd; controleer die vóór 1450 en herhaal toegepaste migraties niet.

**Governance en SQL-test herstellen (nog uitrollen):** de test van 1400 faalt wanneer 1410 het gedeelde checklistlabel daarna heeft overschreven. Voer eerst eventuele nog ontbrekende migratie 1410 uit, vervolgens migratie en test 1420 uit de tabel hieronder. Herhaal daarna de **tests** van 1400 en 1410; herhaal hun migraties niet als ze al zijn uitgevoerd. Migratie 1420 voegt ook het privacyarchief toe. Na commit/push moet Node-01 `web` opnieuw worden gebouwd voor incidentbewerking en archiveren. Deze wijziging raakt Node-02 niet.

**Inline mailafbeeldingen (nog uitrollen):** voer na 1400 migratie 1410 en de bijbehorende test uit de tabel hieronder uit. Bouw daarna op Node-02 `imap-sync` opnieuw en op Node-01 `web` opnieuw. Alleen nieuwe inkomende mail bewaart het Content-ID van een gescande afbeeldingsbijlage; bestaande berichten worden niet automatisch heringelezen. Test met een nieuwe mail met ingebedde afbeelding en controleer dat een externe trackingafbeelding geblokkeerd blijft.

**Nieuwe mailweergave (nog uitrollen):** na migratie 1390 ook migratie 1400 en de bijbehorende test uit de tabel hieronder uitvoeren. Daarna de webcontainer op Node-01 opnieuw bouwen. Test een lange ontvangen HTML-mail en laad externe HTTPS-afbeeldingen pas na de zichtbare IP-waarschuwing. Node-02 hoeft voor deze weergavewijziging niet opnieuw te worden gebouwd.

**Nieuwe mailboxfix (nog uitrollen):** voer na de eerdere migraties migratie 1390 en direct daarna de bijbehorende test uit; beide staan in de tabel hieronder. Controleer op **beide** nodes dat `MAILBOX_CREDENTIALS_KEY` aanwezig is en exact dezelfde 32-byte-base64-sleutel bevat; toon of verstuur de waarde niet. De webserver op Node-01 versleutelt het nieuwe wachtwoord, de IMAP-worker op Node-02 ontsleutelt het. Na commit/push de webcontainer op Node-01 opnieuw bouwen. Sla het wachtwoord opnieuw op en controleer de gemaskeerde status na verversen. Als de oude sleutel op Node-02 afwijkt, herstel eerst dezelfde sleutel voordat je bestaande credentials vervangt.

**Nieuwe opmaakwijziging (nog uitrollen):** bedrijfsmail toont de slogan alleen in de handtekening; de dubbele CTA en footer verdwijnen. Hiervoor is geen SQL nodig. Na de volgende commit en push op **Node-02** `git pull --ff-only origin lovable` uitvoeren, gevolgd door `docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d --build --force-recreate mail-relay`; op **Node-01** dezelfde commit ophalen en `docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web` uitvoeren voor het bijgewerkte handtekeningvoorbeeld en verzendpad. Controleer daarna een ontvangen bedrijfsmail. De al uitgerolde migraties 1350–1380 niet herhalen.

**Huidige stand:** migraties en tests **tot en met 1380** zijn uitgevoerd. Commit `b6b8d0f` draait op Node-01 en Node-02; de eigenaar heeft de nieuwe betaal-, agenda-, vertaal- en bedrijfsmailfunctionaliteit in productie werkend bevestigd.

**Aanvullend bevestigd:** uitgaande bedrijfsmail met HTML-opmaak werkt. De wachtwoordfix en het verwijderen van herhaalde elementen uit de mailopmaak staan nog klaar voor de volgende uitrol.

**Doel:** de resterende brede P0/P1-acceptatie afronden en alleen nieuwe, afzonderlijk gereproduceerde incidenten openhouden.

Voer de fasen in volgorde uit. Ga bij een fout niet door. Bewaar de volledige foutmelding zonder wachtwoorden, tokens, mailinhoud of persoonsgegevens.

## Voortgang

- [x] Fase 1 â€” code controleren en releasecommit maken (`47c7db0`)
- [x] Fase 1b â€” vorige releasecommit naar de gekoppelde branch pushen
- [x] Fase 2 â€” dertien migraties en SQL-tests uitvoeren
- [x] Fase 2b â€” vijf Auth-mailtemplates en onderwerpen in Supabase plaatsen
- [x] Fase 3 â€” bestaande productieconfiguratie geïnventariseerd
- [x] Fase 4 â€” huidige release op Node-02 uitgerold
- [x] Fase 5 â€” huidige release op Node-01 uitgerold
- [x] Herstelronde SQL â€” migraties 1310â€“1320 uitvoeren
- [x] Herstelronde SQL-tests 1310â€“1320 â€” volgens de eigenaar uitgevoerd
- [x] Herstelronde code â€” nieuwe betaaldianose op de website zichtbaar; bevestig de Node-02-commit nog bij de webhookcontrole

- [x] Kortingsherstel SQL â€” migratie 1330 en `paddle_discounted_totals.sql` uitgevoerd

- [x] Factuur en vooruitbetaalde maanden SQL â€” migratie 1340 en `paddle_issued_invoices.sql` uitgevoerd

- [x] Lokalisatie en webhookherstel SQL â€” migratie 1350 en `localized_billing_and_webhook_recovery.sql` uitgevoerd
- [x] Vertaalacceptatie SQL â€” migratie 1360 en `translation_draft_acceptance.sql` uitgevoerd
- [x] HTML-handtekening SQL — migratie 1370 en `branded_html_signature_acceptance.sql` uitgevoerd
- [x] Bedrijfsmailretry SQL — migratie 1380 en `corporate_mail_retry_acceptance.sql` uitgevoerd
- [ ] Fase 6 â€” kritieke praktijktests uitvoeren
- [ ] Fase 7 â€” vrijgavebesluit nemen en incidenten bijwerken

Lokaal slagen 85 tests, TypeScript, lint zonder fouten, de securityaudit en de release-preflight met 30 migratie/testparen. De Windows-productiebuild voltooit de client maar strandt bij de serverbundel op de bekende `EPERM readlink C:\Users\info`; de Linux-productiebuild op Node-01 blijft beslissend. Nieuwe productiefunctionaliteit is pas bewezen nadat de praktijktests zijn afgerond.

## Fase 1 â€” Windows: controleren, committen en pushen

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

- `npm run verify`: 82 tests, TypeScript, securityaudit en release-preflight slagen;
- `npm audit`: geen hoge of kritieke productiekwetsbaarheden;
- `git diff --check`: geen uitvoer;
- geen `.env`, wachtwoord, API-sleutel of mailboxcredential in de staged bestanden.

De Windows-Nitrobouw kan aan het einde stranden op `EPERM: readlink C:\Users\info`. De Linux-build op Node-01 en in CI is daarom beslissend. Herschrijf geen gepubliceerde Gitgeschiedenis.

## Fase 2 â€” Supabase SQL Editor

**Uitgevoerd:** migraties 1180â€“1300 en hun dertien SQL-tests zijn volgens de eigenaar zonder fout uitgevoerd. Voer deze reeks niet opnieuw uit.

Open de SQL Editor van het productieproject. Voer steeds eerst de migratie en direct daarna de test uit. Iedere test moet zonder fout eindigen voordat je doorgaat.

| Volgorde | Migratie                                                                                                            | Test                                                                                                  |
| -------: | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
|        1 | [1180 â€” betrouwbaarheid mail en betaling](supabase/migrations/20260908118000_beta_mail_and_billing_reliability.sql) | [beta_mail_and_billing_reliability.sql](supabase/tests/beta_mail_and_billing_reliability.sql)         |
|        2 | [1190 â€” bedrijfsmailwerkplek](supabase/migrations/20260908119000_corporate_mail_workspace.sql)                      | [corporate_mail_workspace.sql](supabase/tests/corporate_mail_workspace.sql)                           |
|        3 | [1200 â€” mailgesprekken](supabase/migrations/20260908120000_corporate_mail_threads.sql)                              | [corporate_mail_threads.sql](supabase/tests/corporate_mail_threads.sql)                               |
|        4 | [1210 â€” mailbijlagen](supabase/migrations/20260908121000_corporate_mail_attachments.sql)                            | [corporate_mail_attachments.sql](supabase/tests/corporate_mail_attachments.sql)                       |
|        5 | [1220 â€” afgebroken uploads opruimen](supabase/migrations/20260908122000_corporate_mail_upload_cleanup.sql)          | [corporate_mail_upload_cleanup.sql](supabase/tests/corporate_mail_upload_cleanup.sql)                 |
|        6 | [1230 â€” malwarescan](supabase/migrations/20260908123000_corporate_mail_malware_acceptance.sql)                      | [corporate_mail_malware_acceptance.sql](supabase/tests/corporate_mail_malware_acceptance.sql)         |
|        7 | [1240 â€” privacycontrole mail](supabase/migrations/20260908124000_privacy_mail_acceptance.sql)                       | [privacy_mail_acceptance.sql](supabase/tests/privacy_mail_acceptance.sql)                             |
|        8 | [1250 â€” postvakdiagnose](supabase/migrations/20260908125000_mailbox_sync_diagnostics.sql)                           | [mailbox_sync_diagnostics.sql](supabase/tests/mailbox_sync_diagnostics.sql)                           |
|        9 | [1260 â€” Paddle-accountdiagnose](supabase/migrations/20260908126000_paddle_account_diagnostics_acceptance.sql)       | [paddle_account_diagnostics_acceptance.sql](supabase/tests/paddle_account_diagnostics_acceptance.sql) |
|       10 | [1270 â€” Agency-klantregistratie](supabase/migrations/20260908127000_agency_client_registration_link.sql)            | [agency_client_registration_link.sql](supabase/tests/agency_client_registration_link.sql)             |
|       11 | [1280 â€” ondertekende Paddle-checkout](supabase/migrations/20260908128000_paddle_checkout_binding_acceptance.sql)    | [paddle_checkout_binding_acceptance.sql](supabase/tests/paddle_checkout_binding_acceptance.sql)       |
|       12 | [1290 â€” gelokaliseerde platformmail](supabase/migrations/20260908129000_localized_platform_service_mail.sql)        | [localized_platform_service_mail.sql](supabase/tests/localized_platform_service_mail.sql)             |
|       13 | [1300 â€” taalkeuze voor Auth-mail](supabase/migrations/20260908130000_auth_email_locale.sql)                         | [auth_email_locale.sql](supabase/tests/auth_email_locale.sql)                                         |
|       14 | [1310 â€” sociaal profiel afronden](supabase/migrations/20260908131000_social_profile_completion.sql)                 | [social_profile_completion.sql](supabase/tests/social_profile_completion.sql)                         |
|       15 | [1320 â€” â‚¬0-Paddle-transacties herstellen](supabase/migrations/20260908132000_zero_discount_billing_repair.sql)         | [zero_discount_billing_repair.sql](supabase/tests/zero_discount_billing_repair.sql)                     |
|       16 | [1330 â€” Paddle-korting en nettototalen](supabase/migrations/20260908133000_paddle_discounted_totals.sql)            | [paddle_discounted_totals.sql](supabase/tests/paddle_discounted_totals.sql)                             |
|       17 | [1340 â€” echte Paddle-facturen en gestapelde maanden](supabase/migrations/20260908134000_paddle_issued_invoices.sql)  | [paddle_issued_invoices.sql](supabase/tests/paddle_issued_invoices.sql)                                   |
|       18 | [1350 â€” eentalige betaling en webhookherstel](supabase/migrations/20260908135000_localized_billing_and_webhook_recovery.sql) | [localized_billing_and_webhook_recovery.sql](supabase/tests/localized_billing_and_webhook_recovery.sql) |
|       19 | [1360 â€” vertaalconcepten in beide richtingen](supabase/migrations/20260908136000_translation_draft_acceptance.sql) | [translation_draft_acceptance.sql](supabase/tests/translation_draft_acceptance.sql) |
|       20 | [1370 — veilige HTML-handtekening](supabase/migrations/20260908137000_branded_html_signature_acceptance.sql) | [branded_html_signature_acceptance.sql](supabase/tests/branded_html_signature_acceptance.sql) |
|       21 | [1380 — bedrijfsmail opnieuw bezorgen](supabase/migrations/20260908138000_corporate_mail_retry_acceptance.sql) | [corporate_mail_retry_acceptance.sql](supabase/tests/corporate_mail_retry_acceptance.sql) |
|       22 | [1390 — postvakwachtwoord opslaan](supabase/migrations/20260908139000_mailbox_password_save_acceptance.sql) | [mailbox_password_save_acceptance.sql](supabase/tests/mailbox_password_save_acceptance.sql) |
|       23 | [1400 — afbeeldingen en leesvenster bedrijfsmail](supabase/migrations/20260908140000_company_mail_image_viewing_acceptance.sql) | [company_mail_image_viewing_acceptance.sql](supabase/tests/company_mail_image_viewing_acceptance.sql) |
|       24 | [1410 — ingebedde mailafbeeldingen](supabase/migrations/20260908141000_company_mail_inline_images.sql) | [company_mail_inline_images.sql](supabase/tests/company_mail_inline_images.sql) |
|       25 | [1420 — governancearchief en mailacceptatie herstellen](supabase/migrations/20260908142000_governance_archive_and_mail_acceptance.sql) | [governance_archive_and_mail_acceptance.sql](supabase/tests/governance_archive_and_mail_acceptance.sql) |
|       26 | [1430 — accountvensters en handtekeningbeheer](supabase/migrations/20260908143000_account_ui_and_signature_acceptance.sql) | [account_ui_and_signature_acceptance.sql](supabase/tests/account_ui_and_signature_acceptance.sql) |
|       27 | [1440 — dashboard en mobiele reisnavigatie](supabase/migrations/20260908144000_trip_navigation_acceptance.sql) | [trip_navigation_acceptance.sql](supabase/tests/trip_navigation_acceptance.sql) |
|       28 | [1450 — publieke opening en Agency-DNS](supabase/migrations/20260908145000_public_launch_and_agency_dns_acceptance.sql) | [public_launch_and_agency_dns_acceptance.sql](supabase/tests/public_launch_and_agency_dns_acceptance.sql) |
|       29 | [1460 — website en portal scheiden](supabase/migrations/20260908146000_portal_domain_acceptance.sql) | [portal_domain_acceptance.sql](supabase/tests/portal_domain_acceptance.sql) |
|       30 | [1470 — Agency-ingang en gereserveerde hosts](supabase/migrations/20260908147000_agency_portal_entry_acceptance.sql) | [agency_portal_entry_acceptance.sql](supabase/tests/agency_portal_entry_acceptance.sql) |

De tests bewijzen schema, rechten en releasechecklist. Ze vervangen geen echte mail-, betaal- of accounttest. Voer oudere migraties niet opnieuw uit en draai een toegepaste productiemigratie niet handmatig terug.

**Nog te controleren:** migraties tot en met 1380 zijn volgens de eigenaar uitgevoerd; 1390 is volgens de eigenaar inmiddels ook uitgevoerd. Van 1400/1410/1420/1430/1440 is de migratiestatus niet bevestigd. Controleer welke daarvan al zijn toegepast en voer uitsluitend ontbrekende migraties in nummerorde uit, gevolgd door 1450. Draai na 1420 de tests van 1400, 1410 en 1420 opnieuw; draai daarna de tests van 1430, 1440 en 1450. De code voor postvakwachtwoorden, mailweergave, Governance, accountvensters, reisnavigatie en Agency-TLS vereist daarna een nieuwe commit en containerbuild op de betrokken nodes; herhaal toegepaste SQL niet.

**Daarna:** open Corporate Admin â†’ FinanciÃ«n, diagnoseer `txn_01m3266ap61fdket5ft38ax5de` en kies **Bij Paddle controleren en herstellen** met een reden. Controleer daarna de lokale â‚¬0-transactie, het juiste Agency-plan en de einddatum. Paddle biedt voor â‚¬0 geen factuur-PDF; GlobeTrotr mag dan geen lokale Paddle-factuur tonen. Controleer Ã³Ã³k in Paddle de HTTP-status van notificatie `ntf_01m3267edg27hm2e7jkn3q5fqb` en of een nieuwe bezorgpoging `200` krijgt; de handmatige herstelactie alleen verhelpt toekomstige webhookfouten niet. Pas daarna een nieuwe live ICS-feed maken en met GET/HEAD en een agenda-app testen.

De agenda-popup toont na de code-uitrol de aanmaakdatum van een bestaande feed. De geheime URL kan bewust niet uit de opgeslagen hash worden teruggelezen. Bij een nieuwe link verschijnen kopiÃ«ren en **Open in agenda-app**; test de `webcal://`-actie op telefoon en desktop.

### Gerichte productiecontrole na deze deploy

1. Open `https://globetrotr.nl/updates` direct en klik in de footer op **Publieke changelog**. Test NL en EN.
2. Open op telefoon en desktop een bedrijfsmail met lange onderwerpregel, adressen en HTML. De pagina mag horizontaal niet uit het scherm lopen.
3. Open `/register` in een privÃ©venster. De spamcontrole moet verschijnen of na ongeveer 15 seconden een zichtbare fout plus **Opnieuw laden** tonen. Test een nieuwe registratie en wacht maximaal 25 seconden op een duidelijke uitkomst. Bij een timeout eerst de inbox en Supabase Auth Users controleren vÃ³Ã³r opnieuw proberen; de backend kan de aanvraag nog afronden.
4. Gebruik op de registratiepagina een adres dat al via Google bestaat. De UI verwijst naar aanmelden via Google/Discord zonder prijs te geven of een adres al geregistreerd is. Supabase kan bij bevestigde adressen opzettelijk een schijnbaar geslaagd antwoord teruggeven; dit is geen bewijs van een tweede account.
5. Maak een nieuw Google- of Discord-account. Na OAuth moet eenmalig `/complete-profile` verschijnen; sla naam, optionele telefoon en foto op. Een volgende login mag dit scherm niet opnieuw tonen. Controleer ook dat het koppelen van een provider aan een bestaand account via `/account` rechtstreeks naar `/account` teruggaat.
6. Maak met een betaald account een nieuwe live agenda-URL. Node-01 controleert voortaan zelf of de publieke URL daadwerkelijk `200`, `text/calendar` en `BEGIN:VCALENDAR` levert voordat hij de link toont. Test daarna met een agenda-app en, zonder de geheime link te delen, `curl -i 'https://globetrotr.nl/calendar/<token>.ics'` en `curl -I 'https://globetrotr.nl/calendar/<token>.ics'`. Beide moeten `200` en `Content-Type: text/calendar` geven. Een 404 op een bestaande link betekent dat de token is ingetrokken of dat de workspace volgens de database geen actief Pro/Agency-plan heeft. Controleer dan eerst Paddle-toegang en de workerlog (`calendar.feed_unavailable`), daarna de Caddy-route naar Node-02.
7. Voor de ontbrekende Paddle-transactie `txn_01m3266ap61fdket5ft38ax5de`: volg de webhookcontrole hieronder. Migratie 1320 voorkomt dat `credit=0` en `total=0` als volledige terugbetaling gelden. Controleer op Node-02 of de worker een legacy service-role JWT of een `sb_secret_`-sleutel gebruikt; beide worden na deze uitrol correct als Supabase-credential verstuurd. Een voltooide â‚¬0-transactie bij Paddle is nog geen bewezen gekoppeld abonnement. Houd dit incident open tot de bezorging en workspacekoppeling zijn bevestigd.

   Als na de uitrol nog geen lokale transactie bestaat, open **Corporate Admin â†’ FinanciÃ«n â†’ Betaling en account controleren**, vul exact dat transactie-ID in en kies **Bij Paddle controleren en herstellen**. Deze actie vereist op Node-01 een Paddle API-sleutel met `transaction.read` Ã©n `adjustment.read`. Zij weigert transacties die niet voltooid zijn, een onbekend prijs-ID hebben, geen geldige ondertekende workspacekoppeling bevatten, al lokaal bestaan of een refund/credit/chargeback hebben. Deel de Paddle API-sleutel nooit in de browser of in een screenshot. Controleer daarna het juiste account, plan, â‚¬0-betaalregel zonder PDF en de live ICS-feed. De actie vervangt niet de webhookdiagnose voor toekomstige betalingen.

**Bij een nieuwe registratie-504:** noteer het exacte tijdstip en controleer in Supabase **Logs â†’ Auth** de aanvraag rond dat tijdstip. Controleer of er een gebruiker is aangemaakt in **Authentication â†’ Users** en of de bevestigingsmail in de SMTP-log is aangeboden of geweigerd. Een browser-timeout maakt de serveraanvraag niet ongedaan; probeer niet blind hetzelfde adres opnieuw. De huidige UI begrenst alleen de wachttijd, de Auth/SMTP-storing zelf vergt de serverlog om gericht te verhelpen.

## Fase 3 â€” configuratie vÃ³Ã³r de containers starten

### Op beide nodes

Controleer in `/opt/globetrotr/.env.production` dezelfde vier Paddle-price-IDâ€™s:

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

Na migratie 1300 open je in het Supabase Dashboard **Authentication â†’ Email Templates**. Vervang daar de inhoud van Confirm signup, Reset password, Change email address, Magic link en Invite user door de gelijknamige bestanden uit `supabase/templates`. Neem per type ook het conditionele onderwerp uit `supabase/templates/subjects.md` over. De templates gebruiken `user_metadata.language`; Nederlands wordt alleen gekozen bij `nl`, anders blijft Engels de veilige standaard.

Controleer vóór de portaluitrol de huidige Site URL en redirects en noteer ze voor terugval. Na DNS, HTTPS en de nieuwe webbuild wordt de Site URL `https://portal.globetrotr.nl`; volg daarvoor de volgorde in [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md). Deze Dashboard-stap wordt niet door een Git-push uitgevoerd.

### Optioneel: gratis NL/EN-vertaalconcepten

Configureer of start dit hier nog niet. De translation-service staat pas in `deploy/worker.compose.yml` nadat Node-02 in fase 4 de nieuwe commit heeft opgehaald. De exacte installatie staat daarom bij fase 4. Vertalingen blijven handmatig te controleren concepten; gebruik ze niet voor juridische tekst.

## Fase 4 â€” Node-02 eerst uitrollen

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

## Fase 5 â€” Node-01 uitrollen

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

Een lege API-key is correct omdat de dienst uitsluitend via het private netwerk bereikbaar is. Test de verbinding vÃ³Ã³r de webbuild:

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

`web` en `caddy` moeten gezond zijn. De smoketest controleert homepage, registratie, login, status, contact, roadmap, updates en publieke logoâ€™s. Open daarna `https://globetrotr.nl` in een privÃ©venster.

## Fase 6 â€” kritieke praktijktests

### Als Paddle een voltooide transactie toont maar Corporate Admin niets vindt

Een 100%-kortingscode kan een voltooide Paddle-transactie van â‚¬0 opleveren. Dat is geen bewijs dat GlobeTrotr de webhook heeft verwerkt. Controleer eerst de bezorging; geef het account niet handmatig een betaald plan voordat de bron en workspacekoppeling zijn vastgesteld.

Open in **Paddle â†’ Developer tools â†’ Notifications** de bestemming voor `https://globetrotr.nl/api/paddle/webhook`. Controleer of `transaction.completed` is geselecteerd en zoek de bezorgpoging voor het exacte transactie-ID. Noteer tijdstip, HTTP-status en eventuele foutcode; deel geen volledige webhookpayload of ondertekeningssecret.

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

Een afwezig webhookrecord wordt in de diagnose als **onbekende betaalwijze** getoond. De eerdere weergave â€œrecurringâ€ was slechts een onjuiste fallback. Houd het incident open tot dezelfde transactie, het juiste Agency-recht en de vervaldatum lokaal zichtbaar zijn.

Gebruik een Corporate Admin, Agency-beheerder, Agency-klant en twee normale accounts. Test minstens Ã©Ã©n Nederlands en Ã©Ã©n Engels profiel.

### P0 â€” moet slagen vÃ³Ã³r vrijgave

- [ ] Registratie, bevestiging, login, herstelmail, magic link, Google, Discord, passkey en TOTP.
- [ ] Confirm signup, herstel, magic link, e-mailwijziging en Auth-uitnodiging ieder eenmaal met een Nederlands en Engels profiel; onderwerp Ã©n inhoud gebruiken precies Ã©Ã©n taal.
- [ ] EÃ©n reisuitnodiging geeft precies Ã©Ã©n verzorgde e-mail, Ã©Ã©n in-appmelding en een werkende link.
- [ ] Kritieke storing en herstel geven nette NL/EN HTML-mail en leesbare pop-uptekst.
- [ ] Pro en Agency: maandelijks en eenmalig betalen; juiste workspace, plan, factuur, opzegging, verval en refund.
- [ ] Webhookherhaling geeft geen dubbel recht; een gewijzigde browser-workspace-ID geeft geen toegang.
- [ ] Persoonlijk en gedeeld postvak koppelen; HTML-mail met handtekening heen en terug sturen.
- [ ] Inbox, Verzonden, Concepten, Wachtrij, Archief, zoeken, gespreksthread en veilige HTML-weergave.
- [ ] PDF en afbeelding verzenden en ontvangen; EICAR en uitgeschakelde ClamAV blokkeren zonder inhoud te loggen.
- [ ] Agency-klant vÃ³Ã³r registratie koppelen; na bevestiging alleen de bedoelde reis en na archiveren geen toegang.
- [ ] GPX openen; losse ICS en live agenda importeren, reis wijzigen, verversen en link intrekken.
- [ ] Publieke reis toont een leesbare dagindeling zonder prijzen, boekingsnummers, notities of andere privÃ©velden.
- [ ] Corporate Admin-releasecheck uitvoeren; geen kritieke of hoge securitybevinding open laten.

### P1 â€” direct daarna controleren

- [ ] Reis maken; meerdere velden tegelijk wijzigen; planning, boeking, activiteit, taak, document en uitgave beheren.
- [ ] Lange betalersnamen op 320 en 375 pixels zonder overlap.
- [ ] Agency-team, rollen, offerte maken/delen/beantwoorden/omzetten, branding en eigen domein.
- [ ] Bedrijfsbeheerder maken, rechten en mailbox wijzigen, opnieuw inloggen en opslag controleren.
- [ ] Privacyverzoek indienen, beantwoorden en de melding ontvangen.
- [ ] Home, demo, prijzen, contact, status, roadmap, updates, juridische paginaâ€™s, cookies, talen en onderhoud op telefoon en desktop.

Leg iedere afwijking vast met rol, route, apparaat of mailclient, tijdstip en verwacht versus werkelijk gedrag. Deel alleen gemaskeerde Paddle-IDâ€™s en nooit secrets of klantinhoud.

## Fase 7 â€” vrijgavebesluit

Vrijgeven mag alleen wanneer:

- alle dertien migraties en tests zijn geslaagd;
- Node-01 en Node-02 gezond zijn en `npm run smoke` slaagt;
- alle P0-tests en nieuwe Corporate Admin-controles zijn afgevinkt;
- Paddle-rechten, uitnodigingsmail, bedrijfsmail, Agency-klanttoegang, GPX en agenda echt werken;
- geen kritisch of hoog beveiligingsprobleem openstaat.

Zet incidenten pas op **Opgelost** na een geslaagde praktijktest. Openstaande incidenten zijn: dubbele of kale servicemail, verkeerde mailtaal, bedrijfsbeheerder opslaan, Agency-klantkoppeling, GPX, Paddle-rechten, iCal-activiteiten of 404, platte bedrijfsmail, lange publieke deelpagina en overlappende betalersnaam.

Bij een fout na uitrol: stop nieuwe tests, bewaar logs zonder persoonsgegevens en herstel met een nieuwe commit en zo nodig een nieuwe voorwaartse migratie. Gebruik geen force-push en draai geen toegepaste productiemigratie handmatig terug.

Voor een volledig nieuwe serverinstallatie gebruik je [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md). Voor een nieuw leeg Supabase-project gebruik je [SUPABASE_PRODUCTION_MIGRATION.md](SUPABASE_PRODUCTION_MIGRATION.md). Voor overige acceptatiescenarioâ€™s gebruik je [TEST_CHECKLIST.md](TEST_CHECKLIST.md).
