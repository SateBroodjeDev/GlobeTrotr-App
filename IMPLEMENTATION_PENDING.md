# Actuele uitrol naar productie

**Stand: 25 september 2026 · doel: release 1.0**

Dit bestand bevat alleen de uitrolvolgorde. Testresultaten registreer je in
[`TEST_CHECKLIST.md`](TEST_CHECKLIST.md). Dagelijks serverbeheer en rollback staan in
[`SERVER_OPERATIONS.md`](SERVER_OPERATIONS.md).

## Huidige wijzigingenset

- favoriete plaatsen bewaren en tussen reizen hergebruiken;
- gedeelde taken-, vertrek-, boodschappen- en eigen checklists;
- hotelcontrole leidt de waarschijnlijke slaapplaats af uit gedateerde aankomsten en activiteiten;
- privacytekst, accountexport, roadmap en changelog zijn bijgewerkt.

## 1. Lokale controle

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git status --short
npm run verify
npm run build
git diff --check
```

Commit en push pas wanneer deze opdrachten slagen.

## 2. Supabase

Volgens de eigenaar zijn migraties en tests tot en met **1780** uitgevoerd. Voer nu
alleen de opschoonmigratie en controle uit:

1. migratie 1790 voor het archiveren van oude open checks;
2. de bijbehorende alleen-lezen SQL-test.

Een succesvolle SQL-test eindigt zonder foutmelding. Herstel een toegepaste migratie
uitsluitend met een nieuwe voorwaartse migratie.

<!-- release-preflight: confirmed-through=20260908169000_trip_date_shift_acceptance.sql -->

Technische migratie-inventaris na deze grens:

1. `supabase/migrations/20260908170000_confirmed_payment_notifications.sql`
   → `supabase/tests/confirmed_payment_notifications.sql`
2. `supabase/migrations/20260908171000_self_hosted_agency_licensing.sql`
   → `supabase/tests/self_hosted_agency_licensing.sql`
3. `supabase/migrations/20260908172000_notification_link_compatibility.sql`
   → `supabase/tests/notification_link_compatibility.sql`
4. `supabase/migrations/20260908173000_web_push_preferences.sql`
   → `supabase/tests/web_push_preferences.sql`
5. `supabase/migrations/20260908174000_public_agency_host_branding.sql`
   → `supabase/tests/public_agency_host_branding.sql`
6. `supabase/migrations/20260908175000_agency_smtp_delivery.sql`
   → `supabase/tests/agency_smtp_delivery.sql`
7. `supabase/migrations/20260908176000_booking_departure_reminders.sql`
   → `supabase/tests/booking_departure_reminders.sql`
8. `supabase/migrations/20260908177000_favorite_places.sql`
   → `supabase/tests/favorite_places.sql`
9. `supabase/migrations/20260908178000_trip_checklists.sql`
   → `supabase/tests/trip_checklists.sql`
10. `supabase/migrations/20260908179000_archive_open_release_checks.sql`
    → `supabase/tests/archive_open_release_checks.sql`

## 3. Node-01 uitrollen

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull web
docker compose --env-file .env.production -f deploy/web.compose.yml up -d web
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web
curl -I https://globetrotr.nl
curl -I https://portal.globetrotr.nl
```

Beide domeinen moeten reageren en de webcontainer moet gezond blijven. Deze update
vraagt geen nieuwe omgevingsvariabelen.

## 4. Node-02

Voor deze wijziging is op Node-02 geen nieuwe runtimecode nodig. Herstart Node-02
alleen bij een los configuratie- of gezondheidsprobleem.

## 5. Nieuwe testronde

Open [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md), vul commit en uitroltijd in en begin
met de volledig lege acceptatielijst. Een eerdere geslaagde test telt niet automatisch
voor deze uitrol.

## 6. Vrijgave

Gebruik [`PRE_RELEASE.md`](PRE_RELEASE.md) voor het go/no-go-besluit. Leg commit,
uitroltijd, uitvoerder, open afwijkingen, besluit en beslisser vast.
