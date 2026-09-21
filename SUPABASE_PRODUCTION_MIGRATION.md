# Nieuwe Supabase-productieomgeving

> Historische handleiding voor het eenmalig opbouwen van een leeg project.
> GlobeTrotr draait inmiddels met bestaande accounts en migraties tot en met
> 1170 zijn door de eigenaar uitgevoerd. Gebruik voor updates van het actieve
> project [de actuele uitrol](IMPLEMENTATION_PENDING.md).

Deze handleiding is voor een leeg Supabase-productieproject naast een strikt gescheiden niet-productieomgeving.

## Wat Supabase en GlobeTrotr ieder aanmaken

Een nieuw Supabase-project bevat al de beheerde schema's van Supabase:

- `auth.users` bewaart de Auth-accounts. Maak deze tabel nooit zelf en wijzig haar structuur niet.
- `storage.buckets` en `storage.objects` vormen Supabase Storage. Maak deze tabellen nooit zelf.
- Supabase levert daarnaast onder meer de rollen `anon`, `authenticated` en `service_role` en de functies onder `auth` en `storage`.

De GlobeTrotr-migraties bouwen hierop voort:

- de eerste migratie maakt `public.profiles` en `public.workspaces`;
- `public.profiles.id` en `public.workspaces.user_id` verwijzen veilig naar `auth.users.id`;
- de trigger `on_auth_user_created` maakt na registratie automatisch een profiel;
- de app maakt bij het eerste gebruik de persoonlijke workspace aan;
- latere migraties maken reizen, reisgenoten, uitgaven, Agency, Corporate Admin, meldingen, feedback, facturatie en overige tabellen;
- de benodigde private Storage-buckets en hun policies worden eveneens door de migraties aangemaakt.

Na `db push` is het dus normaal dat `auth.users`, `public.profiles` en `public.workspaces` nog geen rijen bevatten. Accounts maak je pas daarna via GlobeTrotr. Sommige globale tabellen bevatten wel configuratie, bekende beta-items of releasecontroles die door migraties zijn toegevoegd.

## Deel 1 — Nieuw Supabase-account en project

1. Ga naar [supabase.com/dashboard](https://supabase.com/dashboard) en maak je account aan.
2. Beveilig het Supabase-account direct met een uniek wachtwoord en MFA.
3. Maak een organisatie aan, bijvoorbeeld **GlobeTrotr**.
4. Kies **New project**.
5. Gebruik bijvoorbeeld de projectnaam `globetrotr-production`.
6. Laat Supabase een sterk databasewachtwoord genereren en bewaar dit in een wachtwoordmanager. Dit is niet hetzelfde als het wachtwoord van je Supabase-account.
7. Kies een Europese regio. Kies Frankfurt wanneer die optie beschikbaar en passend is voor de Duitse hostinglocatie.
8. Kies voorlopig het Free-plan wanneer de actuele limieten voldoende zijn.
9. Wacht totdat het project volledig is ingericht.

Bewaar daarna deze drie gegevens in je wachtwoordmanager of beveiligde implementatienotities:

- **Project ref:** het gedeelte na `/project/` in de dashboard-URL;
- **Project URL:** te vinden via **Connect** of **Settings → API Keys**;
- **Database password:** het wachtwoord uit stap 6.

Zet de databaseverbinding, het databasewachtwoord en geheime API-sleutels nooit in Git, screenshots, tickets of de publieke changelog.

## Deel 2 — Supabase CLI controleren op Windows

Open PowerShell in de hoofdmap van deze repository. Dat is de map waarin `package.json` en de map `supabase` staan.

Controleer eerst Node en npm:

```powershell
node --version
npm --version
```

Gebruik Node.js 20 of nieuwer. Controleer daarna de CLI zonder een globale installatie:

```powershell
npx supabase@latest --version
```

Wanneer `npx` vraagt of het pakket tijdelijk geïnstalleerd mag worden, antwoord je met `y`. Je hoeft `supabase init` niet uit te voeren: deze repository bevat al `supabase/config.toml` en alle migraties.

## Deel 3 — Inloggen en uitsluitend het nieuwe project koppelen

Voer vanuit de repository uit:

```powershell
npx supabase@latest login
```

De browser opent voor toestemming. Koppel daarna het nieuwe project:

```powershell
npx supabase@latest link --project-ref JOUW_NIEUWE_PROJECT_REF
```

Vervang `JOUW_NIEUWE_PROJECT_REF` door de projectreferentie uit het nieuwe dashboard. De CLI vraagt om het databasewachtwoord. PowerShell toont tijdens het typen mogelijk geen tekens; dat is normaal.

Controleer vóór iedere databaseactie welk project gekoppeld is:

```powershell
npx supabase@latest projects list
npx supabase@latest migration list
```

De nieuwe remote-kolom in `migration list` is vóór de eerste push leeg. Voer hier geen `db pull` uit: het nieuwe project hoort leeg te blijven en Git is de bron voor het schema.

## Deel 4 — Migraties vooraf bekijken en uitvoeren

Bekijk eerst zonder wijzigingen wat de CLI wil toepassen:

```powershell
npx supabase@latest db push --dry-run
```

Voor een werkelijk nieuw project moet de lijst beginnen met `20260902095509` en eindigen met de **laatste migratie in de checkout**. Het vroegere eindnummer `20260908099000` is verouderd. Voer daarna alle migraties uit:

```powershell
npx supabase@latest db push
```

Onderbreek dit proces niet. Als de verbinding toch wegvalt, voer je hetzelfde commando opnieuw uit. Supabase registreert geslaagde migraties en slaat die bij de volgende poging over. Gebruik geen `--include-seed`: productie krijgt geen testgebruikers of voorbeeldreizen.

Controleer na afloop:

```powershell
npx supabase@latest migration list
```

Alle lokale migratienummers moeten ook in de remote-kolom staan. Controleer in het dashboard onder **Table Editor** minimaal `profiles`, `workspaces`, `trips`, `trip_members`, `notifications`, `platform_admins` en `release_checklist_items`.

## Deel 5 — Auth en gebruikersdata begrijpen

Ga in het Supabase-dashboard naar **Authentication → Users**. Direct na de migraties hoort deze lijst leeg te zijn.

Maak gebruikers niet als losse rijen in `public.profiles`. De correcte volgorde is:

1. configureer eerst de Auth-URL's;
2. open de productieversie van GlobeTrotr;
3. registreer daar je eerste account;
4. Supabase schrijft dit account naar `auth.users`;
5. de GlobeTrotr-trigger maakt automatisch `public.profiles` aan;
6. GlobeTrotr maakt bij het eerste gebruik de workspace aan.

Hierdoor behouden Auth, profiel en workspace hetzelfde UUID. Zelf rijen invoegen kan die koppeling verbreken.

Stel onder **Authentication → URL Configuration** uiteindelijk in:

- **Site URL:** `https://globetrotr.nl`;
- alleen de werkelijk gebruikte HTTPS-redirects voor productie en eventueel een afzonderlijk stagingdomein.

Voeg geen brede productie-wildcards toe wanneer enkele concrete redirect-URL's voldoende zijn. Configureer SMTP vóór je externe gebruikers uitnodigt, zodat bevestiging, wachtwoordherstel en e-mailwijzigingen betrouwbaar aankomen.

## Deel 6 — API-sleutels voor de VPS

Open in het nieuwe project **Connect** of **Settings → API Keys**. Gebruik:

- de **publishable key** voor browsercode en gebruikerssessies;
- een **secret key** uitsluitend op de VPS voor vertrouwde serverfuncties.

De huidige GlobeTrotr-code verwacht deze namen:

```dotenv
VITE_SUPABASE_URL=https://JOUW_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://JOUW_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

De `VITE_`-waarden komen in de browserbundle en mogen daarom uitsluitend de URL en publishable key bevatten. `SUPABASE_SERVICE_ROLE_KEY` mag alleen in de VPS-secretomgeving bestaan. Hoewel de variabelenaam om compatibiliteitsredenen nog `SERVICE_ROLE_KEY` zegt, kan zij de nieuwe `sb_secret_...`-sleutel bevatten. Plaats deze nooit in een Vite-variabele.

Andere GlobeTrotr-waarden, zoals `TURNSTILE_SECRET_KEY`, `SKYLINK_API_KEY`, `GITHUB_ISSUES_TOKEN`, `CRON_SECRET` en toekomstige SMTP- of vertaalsleutels, worden afzonderlijk als serversecret ingesteld. De Turnstile-sitekey is een openbare buildwaarde; de Turnstile-secretkey blijft op de server.

## Deel 7 — Storage controleren

De migraties maken de GlobeTrotr-buckets en policies. Controleer onder **Storage** na `db push` minimaal de aanwezige buckets voor bonnetjes, avatars, Agency-logo's, reisdocumenten en reisomslagen. Private buckets moeten als private blijven gemarkeerd.

Upload in deze fase nog geen echte documenten. Test eerst na registratie met één onbelangrijke profielfoto en één testomslag of uploaden, bekijken en verwijderen alleen met het juiste account lukt.

## Deel 8 — Eerste Corporate Admin maken

Maak eerst via de productie-app je eigen normale account. Controleer in het dashboard dat dezelfde UUID voorkomt in:

- **Authentication → Users** (`auth.users`);
- **Table Editor → profiles**;
- **Table Editor → workspaces** nadat het dashboard eenmaal geopend is.

Gebruik daarna pas het bestaande, gecontroleerde Corporate Admin-SQL-blok uit `supabase/maintenance/reset_all_user_data.sql`. Pas uitsluitend het e-mailadres aan en voer alleen het uitgecommentarieerde `DO $$ ... $$;`-blok uit. Voer het resetgedeelte van dat bestand absoluut niet uit.

Log na de rolwijziging volledig uit en opnieuw in. De Corporate Admin-claim zit in het JWT en verschijnt pas in een nieuwe sessie.

## Deel 9 — Eindcontrole en terugval

1. Voer `supabase/tests/production_supabase_acceptance.sql` uit in de SQL Editor.
2. Open Corporate Admin → Releasecheck en controleer of de productie-items zichtbaar zijn.
3. Maak een tweede tijdelijk account en test uitnodigen, accepteren, rechten en verwijderen.
4. Test één reis inclusief uitgave, bestand, openbare link en export.
5. Controleer dat een eventuele testomgeving een afzonderlijke database gebruikt en de VPS naar het productieproject wijst.
6. Maak vóór DNS-omschakeling een eerste logische databaseback-up.

Bewaar eventuele testdata uitsluitend in een afzonderlijke niet-productieomgeving en gebruik nooit productiesleutels in previews.

## Officiële naslag

- [Supabase CLI installeren en gebruiken](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Remote projecten koppelen en migraties pushen](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase Auth-gebruikers en openbare profielen](https://supabase.com/docs/guides/auth/managing-user-data)
- [Publishable en secret API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## Waarom de migraties niet worden samengevoegd

De bestanden worden bewust niet tot één baseline samengevoegd. Latere migraties repareren en beveiligen objecten uit eerdere migraties; behoud van de volgorde maakt de opbouw controleerbaar en zorgt dat Supabase exact registreert welke stap is uitgevoerd. De CLI voert de 106 bestanden automatisch uit, waardoor handmatig samenvoegen nauwelijks tijd bespaart en wel extra risico introduceert.

## Volledige volgorde

### Basis en reisdata

- [20260902095509_d1ca9601-d849-496f-970d-ce704e9b7b27.sql](supabase/migrations/20260902095509_d1ca9601-d849-496f-970d-ce704e9b7b27.sql)
- [20260902095517_6084a512-25d1-461d-8868-bc66152d5616.sql](supabase/migrations/20260902095517_6084a512-25d1-461d-8868-bc66152d5616.sql)
- [20260904085029_9a9e1ff1-9c35-481f-8c37-758f569bee67.sql](supabase/migrations/20260904085029_9a9e1ff1-9c35-481f-8c37-758f569bee67.sql)
- [20260906113000_add_sharing_pin.sql](supabase/migrations/20260906113000_add_sharing_pin.sql)
- [20260906140000_normalize_globetrotr_data.sql](supabase/migrations/20260906140000_normalize_globetrotr_data.sql)
- [20260906150000_add_global_trip_uuid_and_collaboration_rls.sql](supabase/migrations/20260906150000_add_global_trip_uuid_and_collaboration_rls.sql)
- [20260906160000_repair_missing_trips_and_json_ids.sql](supabase/migrations/20260906160000_repair_missing_trips_and_json_ids.sql)
- [20260906170000_add_profile_timezone.sql](supabase/migrations/20260906170000_add_profile_timezone.sql)
- [20260906180000_booking_details_and_clean_members.sql](supabase/migrations/20260906180000_booking_details_and_clean_members.sql)
- [20260906190000_restrict_receipts_to_agency.sql](supabase/migrations/20260906190000_restrict_receipts_to_agency.sql)
- [20260906200000_atomic_trip_snapshots.sql](supabase/migrations/20260906200000_atomic_trip_snapshots.sql)
- [20260907120000_persistent_notifications.sql](supabase/migrations/20260907120000_persistent_notifications.sql)
- [20260907150000_fix_snapshot_column_ambiguity.sql](supabase/migrations/20260907150000_fix_snapshot_column_ambiguity.sql)
- [20260907160000_trip_snapshot_versions.sql](supabase/migrations/20260907160000_trip_snapshot_versions.sql)
- [20260907170000_trip_description.sql](supabase/migrations/20260907170000_trip_description.sql)
- [20260907234000_restrict_trip_financials.sql](supabase/migrations/20260907234000_restrict_trip_financials.sql)
- [20260908000000_update_linked_member_roles.sql](supabase/migrations/20260908000000_update_linked_member_roles.sql)
- [20260908002000_trip_text_limits.sql](supabase/migrations/20260908002000_trip_text_limits.sql)

### Delen, beveiliging en feedback

- [20260908010000_public_trip_api.sql](supabase/migrations/20260908010000_public_trip_api.sql)
- [20260908013000_public_trip_bookings.sql](supabase/migrations/20260908013000_public_trip_bookings.sql)
- [20260908014000_public_trip_weather.sql](supabase/migrations/20260908014000_public_trip_weather.sql)
- [20260908015000_security_hardening.sql](supabase/migrations/20260908015000_security_hardening.sql)
- [20260908016000_beta_feedback_and_known_issues.sql](supabase/migrations/20260908016000_beta_feedback_and_known_issues.sql)
- [20260908017000_archive_feedback_and_issues.sql](supabase/migrations/20260908017000_archive_feedback_and_issues.sql)
- [20260908018000_feedback_issue_categories.sql](supabase/migrations/20260908018000_feedback_issue_categories.sql)
- [20260908019000_platform_admins_and_audit.sql](supabase/migrations/20260908019000_platform_admins_and_audit.sql)

### Uitnodigingen en meldingen

- [20260908020000_trip_invitation_responses.sql](supabase/migrations/20260908020000_trip_invitation_responses.sql)
- [20260908021000_seed_current_beta_limitations.sql](supabase/migrations/20260908021000_seed_current_beta_limitations.sql)
- [20260908022000_resolve_existing_invitation_memberships.sql](supabase/migrations/20260908022000_resolve_existing_invitation_memberships.sql)
- [20260908023000_invalidate_declined_and_stale_invitations.sql](supabase/migrations/20260908023000_invalidate_declined_and_stale_invitations.sql)
- [20260908024000_remove_members_and_deduplicate.sql](supabase/migrations/20260908024000_remove_members_and_deduplicate.sql)
- [20260908025000_notify_invitation_responses.sql](supabase/migrations/20260908025000_notify_invitation_responses.sql)
- [20260908026000_notification_lifecycle.sql](supabase/migrations/20260908026000_notification_lifecycle.sql)
- [20260908027000_invitation_cleanup_and_platform_publish.sql](supabase/migrations/20260908027000_invitation_cleanup_and_platform_publish.sql)
- [20260908028000_platform_status_lifecycle.sql](supabase/migrations/20260908028000_platform_status_lifecycle.sql)
- [20260908029000_manage_pending_trip_invitations.sql](supabase/migrations/20260908029000_manage_pending_trip_invitations.sql)

### Agency

- [20260908030000_agency_workspace_members.sql](supabase/migrations/20260908030000_agency_workspace_members.sql)
- [20260908031000_agency_team_management.sql](supabase/migrations/20260908031000_agency_team_management.sql)
- [20260908032000_agency_settings_and_logo.sql](supabase/migrations/20260908032000_agency_settings_and_logo.sql)
- [20260908033000_agency_permission_overrides.sql](supabase/migrations/20260908033000_agency_permission_overrides.sql)
- [20260908034000_trip_branding_overrides.sql](supabase/migrations/20260908034000_trip_branding_overrides.sql)
- [20260908035000_agency_clients.sql](supabase/migrations/20260908035000_agency_clients.sql)
- [20260908036000_agency_audit_log.sql](supabase/migrations/20260908036000_agency_audit_log.sql)
- [20260908037000_fix_agency_clients_and_operations.sql](supabase/migrations/20260908037000_fix_agency_clients_and_operations.sql)
- [20260908038000_agency_notification_preferences.sql](supabase/migrations/20260908038000_agency_notification_preferences.sql)
- [20260908039000_secure_trip_documents.sql](supabase/migrations/20260908039000_secure_trip_documents.sql)
- [20260908040000_trip_document_expiry.sql](supabase/migrations/20260908040000_trip_document_expiry.sql)
- [20260908041000_agency_tasks.sql](supabase/migrations/20260908041000_agency_tasks.sql)
- [20260908042000_agency_templates.sql](supabase/migrations/20260908042000_agency_templates.sql)
- [20260908043000_agency_quotes.sql](supabase/migrations/20260908043000_agency_quotes.sql)
- [20260908044000_agency_quote_management.sql](supabase/migrations/20260908044000_agency_quote_management.sql)
- [20260908045000_secure_agency_quote_sharing.sql](supabase/migrations/20260908045000_secure_agency_quote_sharing.sql)
- [20260908046000_agency_quote_responses.sql](supabase/migrations/20260908046000_agency_quote_responses.sql)
- [20260908047000_convert_agency_quotes.sql](supabase/migrations/20260908047000_convert_agency_quotes.sql)
- [20260908048000_manage_agency_quote_shares.sql](supabase/migrations/20260908048000_manage_agency_quote_shares.sql)
- [20260908049000_agency_access_notifications.sql](supabase/migrations/20260908049000_agency_access_notifications.sql)
- [20260908050000_agency_branding_notifications.sql](supabase/migrations/20260908050000_agency_branding_notifications.sql)
- [20260908051000_agency_task_notifications.sql](supabase/migrations/20260908051000_agency_task_notifications.sql)
- [20260908052000_trip_document_notifications.sql](supabase/migrations/20260908052000_trip_document_notifications.sql)
- [20260908053000_agency_client_notifications.sql](supabase/migrations/20260908053000_agency_client_notifications.sql)
- [20260908054000_agency_quote_lifecycle.sql](supabase/migrations/20260908054000_agency_quote_lifecycle.sql)
- [20260908055000_restore_public_function_grants.sql](supabase/migrations/20260908055000_restore_public_function_grants.sql)
- [20260908056000_trip_access_notifications.sql](supabase/migrations/20260908056000_trip_access_notifications.sql)
- [20260908057000_important_trip_notifications.sql](supabase/migrations/20260908057000_important_trip_notifications.sql)
- [20260908058000_trip_content_notifications.sql](supabase/migrations/20260908058000_trip_content_notifications.sql)
- [20260908059000_scheduled_notification_maintenance.sql](supabase/migrations/20260908059000_scheduled_notification_maintenance.sql)
- [20260908060000_trip_settlement_notifications.sql](supabase/migrations/20260908060000_trip_settlement_notifications.sql)
- [20260908061000_trip_notification_preferences.sql](supabase/migrations/20260908061000_trip_notification_preferences.sql)
- [20260908062000_agency_suppliers.sql](supabase/migrations/20260908062000_agency_suppliers.sql)
- [20260908063000_agency_domains_and_mail.sql](supabase/migrations/20260908063000_agency_domains_and_mail.sql)
- [20260908064000_email_outbox_test_mode.sql](supabase/migrations/20260908064000_email_outbox_test_mode.sql)

### Platform, bedrijf en facturatie

- [20260908065000_provider_quotas_and_worker_queue.sql](supabase/migrations/20260908065000_provider_quotas_and_worker_queue.sql)
- [20260908066000_platform_operations_and_release_checklist.sql](supabase/migrations/20260908066000_platform_operations_and_release_checklist.sql)
- [20260908067000_corporate_business_operations.sql](supabase/migrations/20260908067000_corporate_business_operations.sql)
- [20260908068000_corporate_mail_workflow.sql](supabase/migrations/20260908068000_corporate_mail_workflow.sql)
- [20260908069000_billing_operations.sql](supabase/migrations/20260908069000_billing_operations.sql)
- [20260908070000_corporate_staff_management.sql](supabase/migrations/20260908070000_corporate_staff_management.sql)

### Publieke website en acceptatie

- [20260908071000_fix_trip_change_delete_trigger.sql](supabase/migrations/20260908071000_fix_trip_change_delete_trigger.sql)
- [20260908072000_update_release_checklist.sql](supabase/migrations/20260908072000_update_release_checklist.sql)
- [20260908073000_refresh_known_beta_issues.sql](supabase/migrations/20260908073000_refresh_known_beta_issues.sql)
- [20260908074000_public_testimonials.sql](supabase/migrations/20260908074000_public_testimonials.sql)
- [20260908075000_contact_and_release_checks.sql](supabase/migrations/20260908075000_contact_and_release_checks.sql)
- [20260908076000_contact_message_management.sql](supabase/migrations/20260908076000_contact_message_management.sql)
- [20260908077000_expand_release_acceptance_checklist.sql](supabase/migrations/20260908077000_expand_release_acceptance_checklist.sql)
- [20260908078000_corporate_governance.sql](supabase/migrations/20260908078000_corporate_governance.sql)
- [20260908079000_agency_reporting_and_automation.sql](supabase/migrations/20260908079000_agency_reporting_and_automation.sql)
- [20260908080000_apply_agency_automation_settings.sql](supabase/migrations/20260908080000_apply_agency_automation_settings.sql)
- [20260908081000_secure_agency_quote_variant_reads.sql](supabase/migrations/20260908081000_secure_agency_quote_variant_reads.sql)
- [20260908082000_security_grants_and_release_checks.sql](supabase/migrations/20260908082000_security_grants_and_release_checks.sql)
- [20260908083000_maintenance_privacy_and_acceptance.sql](supabase/migrations/20260908083000_maintenance_privacy_and_acceptance.sql)
- [20260908084000_feedback_conversations_and_admin_alerts.sql](supabase/migrations/20260908084000_feedback_conversations_and_admin_alerts.sql)
- [20260908085000_account_security_acceptance.sql](supabase/migrations/20260908085000_account_security_acceptance.sql)

### Reisfuncties en releasepoort

- [20260908086000_calendar_export_acceptance.sql](supabase/migrations/20260908086000_calendar_export_acceptance.sql)
- [20260908087000_trip_insights_acceptance.sql](supabase/migrations/20260908087000_trip_insights_acceptance.sql)
- [20260908088000_public_navigation_about_maintenance_acceptance.sql](supabase/migrations/20260908088000_public_navigation_about_maintenance_acceptance.sql)
- [20260908089000_trip_duplicate_acceptance.sql](supabase/migrations/20260908089000_trip_duplicate_acceptance.sql)
- [20260908090000_route_tools_acceptance.sql](supabase/migrations/20260908090000_route_tools_acceptance.sql)
- [20260908091000_trip_comparison_acceptance.sql](supabase/migrations/20260908091000_trip_comparison_acceptance.sql)
- [20260908092000_trip_tasks.sql](supabase/migrations/20260908092000_trip_tasks.sql)
- [20260908093000_trip_today_acceptance.sql](supabase/migrations/20260908093000_trip_today_acceptance.sql)
- [20260908094000_trip_map_layers_acceptance.sql](supabase/migrations/20260908094000_trip_map_layers_acceptance.sql)
- [20260908095000_trip_cover_photos.sql](supabase/migrations/20260908095000_trip_cover_photos.sql)
- [20260908096000_pre_vps_release_gate.sql](supabase/migrations/20260908096000_pre_vps_release_gate.sql)
- [20260908097000_production_ui_acceptance.sql](supabase/migrations/20260908097000_production_ui_acceptance.sql)
- [20260908098000_interface_feedback_acceptance.sql](supabase/migrations/20260908098000_interface_feedback_acceptance.sql)
- [20260908099000_production_supabase_acceptance.sql](supabase/migrations/20260908099000_production_supabase_acceptance.sql)

## Na de migraties

1. Voer de SQL-regressietests uit `supabase/tests` uit tegen een nog lege of speciaal daarvoor gemaakte testdataset.
2. Maak het eerste account via de applicatie en geef dit account daarna de Corporate Admin-claim en platformrol.
3. Configureer Auth Site URL, toegestane redirect-URL's, Storage, SMTP en serversecrets.
4. Maak daarna pas echte reizigers- en Agency-accounts aan.
5. Importeer uitsluitend productiegegevens die je bewust wilt behouden.

## Niet handmatig samenvoegen

- Verwijder geen herstel- of securitymigraties omdat het eindobject in een later bestand opnieuw wordt aangemaakt.
- Plak niet alle bestanden als een losse SQL-query; bij een fout ontbreekt dan betrouwbare migratieregistratie.
- Gebruik `db push` opnieuw na een onderbreking. Supabase slaat reeds geslaagde migraties over.
- De bestanden onder `supabase/tests` zijn controles en horen niet in `supabase/migrations`.
