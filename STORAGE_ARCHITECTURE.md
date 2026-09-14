# Opslagarchitectuur

## Besluit voor de eerste productieversie

GlobeTrotr houdt private reisdocumenten, bonnetjes en Agency-logo's voorlopig in Supabase Storage. De bestaande buckets, RLS-regels en ondertekende URLs blijven hierdoor één beveiligingsmodel delen met Supabase Auth en PostgreSQL.

Hetzner Object Storage is een later inzetbare S3-provider voor grotere bestanden, back-ups of archiefdata. Nieuwe servercode behandelt een object als `provider + bucket + objectKey`; een databasepad of publieke URL geldt nooit als autorisatie. Browserclients krijgen uitsluitend een kort geldige upload- of download-URL nadat de server de workspace- en reisrechten heeft gecontroleerd.

## Migratie zonder onderbreking

1. Maak een private Hetzner-bucket in dezelfde EU-regio als de applicatie.
2. Bewaar S3-sleutels uitsluitend als worker-secrets en gebruik een afzonderlijke sleutel per omgeving.
3. Kopieer objecten op de achtergrond en controleer omvang en checksum.
4. Registreer pas daarna de nieuwe provider en objectsleutel.
5. Lees tijdelijk eerst de nieuwe locatie en val voor oude records terug op Supabase.
6. Verwijder het oude object pas na een bewaartermijn en een geslaagde hersteltest.

Publieke buckets worden niet gebruikt voor persoonsgegevens of reisdocumenten. Back-ups krijgen een afzonderlijke bucket, lifecyclebeleid en sleutel; een objectstore is geen vervanging voor een geteste databaseback-up.

## Worker-VPS

`platform_provider_controls` is de centrale noodstop per externe dienst. `external_api_usage` bewaakt dagquota per workspace. `worker_jobs` gebruikt idempotentiesleutels, `FOR UPDATE SKIP LOCKED`, maximaal tien pogingen en begrensde back-off. Alleen de service-role kan deze tabellen en functies gebruiken.
