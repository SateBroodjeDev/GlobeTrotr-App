# GlobeTrotr worker

Deze Node 24-service draait op VPS 2. De worker claimt databasejobs exclusief, voert uitsluitend bekende jobtypen uit en schrijft alleen technische IDs en foutcodes naar stdout. Het health-endpoint staat standaard op poort `9091`.

Verplicht: `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY`. Optioneel: `WORKER_POLL_MS`, `WORKER_BATCH_SIZE` en `WORKER_HEALTH_PORT`. `provider.healthcheck` accepteert uitsluitend HTTPS-hostnamen uit de kommagescheiden allowlist `WORKER_HEALTHCHECK_HOSTS`; zonder allowlist worden deze opdrachten veilig geweigerd.

E-mail wordt uitsluitend geclaimd wanneer zowel `MAIL_DELIVERY_RELAY_URL` als `MAIL_DELIVERY_RELAY_TOKEN` bestaan én `email_delivery_config.mode` bewust op `live` staat. `mail-relay.mjs` levert de interne HTTP-naar-SMTP-relay op poort 9092. SMTP-inloggegevens staan alleen in `.env.mail-relay`; de worker, PostgreSQL, browsercode en logs ontvangen ze niet.

De relay accepteert alleen een correct Bearer-token, geldige bericht- en idempotentie-IDs, maximaal 25 ontvangers per veld en afzenders uit `SMTP_ALLOWED_FROM_DOMAINS`. Bestands- en URL-bijlagen zijn uitgeschakeld. De relaypoort wordt uitsluitend binnen het Docker-netwerk aangeboden.

Ondersteunde algemene jobs zijn `notification.maintenance` en een begrensde `provider.healthcheck` met een HTTPS-URL. Onbekende jobtypen mislukken gecontroleerd en worden volgens de database-back-off opnieuw aangeboden.

Na migratie 1540 controleert de worker ieder uur op peilingen die binnen 24 uur sluiten. Dit vereist geen aparte cronjob. Per peiling en ontvanger ontstaat maximaal één herinnering, alleen voor leden die nog niet hebben gestemd. De Supabase-functie is alleen met de service-role aanroepbaar; de e-mail volgt de bestaande wachtrij, accounttaal en `tripUpdates`-voorkeur.

Na migratie 1550 verwijdert de worker ieder uur verlopen Agency-formulierverzoeken waarvan de ingestelde bewaartermijn voorbij is. Antwoorden verdwijnen door de gekoppelde cascade; deze opschoning is alleen via de service-role beschikbaar.

Na migratie 1560 claimt de worker zelf-gehoste mailboxverzoeken wanneer `STALWART_URL`, `STALWART_API_TOKEN` en `STALWART_DOMAIN_ID` zijn ingesteld. Het postvakwachtwoord wordt alleen in het workerproces ontsleuteld; naar Supabase gaan uitsluitend provisioningstatus, foutcode en Stalwart-account-ID terug. Een fout wordt niet onbeperkt herhaald. Na diagnose zet opnieuw opslaan in Corp Admin het verzoek weer op `pending`.

Na migratie 1580 koppelt `imap-sync` ontvangen mail voor een automatisch reispostvak aan een controleerbaar boekingsconcept. De parser bewaart alleen begrensde herkende velden in het concept, logt geen berichtinhoud, dedupliceert per reis en markeert wijzigingen en annuleringen. De gewone bedrijfsmailopslag blijft de bron voor veilige tekst en gescande bijlagen. De hoofdworker verwijdert ieder uur verlopen concepten, bronberichten en bijlagen volgens de gekozen bewaartermijn.
