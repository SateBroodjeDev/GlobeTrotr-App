# Agency implementeren in Lovable/Supabase

De Agency-code is gebouwd. Voer onderstaande nog niet uitgevoerde migraties in exact deze volgorde uit via de Supabase SQL Editor. Stop bij de eerste fout; voer latere bestanden dan nog niet uit.

1. `20260908058000_trip_content_notifications.sql`
2. `20260908059000_scheduled_notification_maintenance.sql`
3. `20260908060000_trip_settlement_notifications.sql`
4. `20260908061000_trip_notification_preferences.sql`
5. `20260908062000_agency_suppliers.sql`
6. `20260908063000_agency_domains_and_mail.sql`
7. `20260908064000_email_outbox_test_mode.sql`
8. `20260908065000_provider_quotas_and_worker_queue.sql`
9. `20260908066000_platform_operations_and_release_checklist.sql`
10. `20260908067000_corporate_business_operations.sql`
11. `20260908068000_corporate_mail_workflow.sql`
12. `20260908069000_billing_operations.sql`
13. `20260908070000_corporate_staff_management.sql`

Voer daarna deze tests afzonderlijk uit:

1. `trip_content_notifications.sql`
2. `notification_system_audit.sql`
3. `scheduled_notification_maintenance.sql`
4. `trip_settlement_notifications.sql`
5. `trip_notification_preferences.sql`
6. `agency_suppliers.sql`
7. `agency_domains_and_mail.sql`
8. `email_outbox_test_mode.sql`
9. `provider_quotas_and_worker_queue.sql`
10. `platform_operations_and_release_checklist.sql`
11. `corporate_business_operations.sql`
12. `corporate_mail_workflow.sql`
13. `billing_operations.sql`
14. `corporate_staff_management.sql`
15. `agency_release_gate.sql`

Elke test gebruikt een transactie en eindigt met `ROLLBACK`. Een leeg succesresultaat is correct. Pas nadat alle tests slagen wordt de actuele applicatiecommit naar de Lovable-branch gepusht.

Controleer in Lovable vervolgens met een Agency-eigenaar, adviseur, finance-gebruiker en klant de secties uit `TEST_CHECKLIST.md`. Test vooral persoonlijke rechten, directe brandingupdates, klanttoegang, offertes, documenten, meldingsvoorkeuren en leveranciers. Leg alleen werkelijk afwijkend gedrag als bekend probleem vast.

De dagelijkse functie `public.run_scheduled_notification_maintenance(...)` hoeft in Lovable nog niet als cronjob te worden ingesteld. Dat gebeurt bij de latere VPS-implementatie. Handmatig uitvoeren met de service-role blijft uitsluitend bedoeld voor beheer en tests.
