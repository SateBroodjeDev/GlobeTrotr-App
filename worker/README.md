# GlobeTrotr worker

Deze Node 24-service draait op VPS 2. De worker claimt databasejobs exclusief, voert uitsluitend bekende jobtypen uit en schrijft alleen technische IDs en foutcodes naar stdout. Het health-endpoint staat standaard op poort `9091`.

Verplicht: `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY`. Optioneel: `WORKER_POLL_MS`, `WORKER_BATCH_SIZE` en `WORKER_HEALTH_PORT`. `provider.healthcheck` accepteert uitsluitend HTTPS-hostnamen uit de kommagescheiden allowlist `WORKER_HEALTHCHECK_HOSTS`; zonder allowlist worden deze opdrachten veilig geweigerd.

E-mail wordt uitsluitend geclaimd wanneer zowel `MAIL_DELIVERY_RELAY_URL` als `MAIL_DELIVERY_RELAY_TOKEN` bestaan én `email_delivery_config.mode` bewust op `live` staat. De relay mag later een lokale SMTP-service op dezelfde private server zijn. SMTP-inloggegevens blijven in die service en komen niet in PostgreSQL, browsercode of logs.

Ondersteunde algemene jobs zijn `notification.maintenance` en een begrensde `provider.healthcheck` met een HTTPS-URL. Onbekende jobtypen mislukken gecontroleerd en worden volgens de database-back-off opnieuw aangeboden.
