-- HANDMATIGE DESTRUCTIEVE RESET — nooit als migratie uitvoeren.
-- Vereist 20260908071000_fix_trip_change_delete_trigger.sql.
--
-- Dit script verwijdert alle GlobeTrotr-accounts en alle bijbehorende
-- gebruikers-, reis-, Agency-, betaal-, feedback- en mailboxdata.
-- Databasefuncties, migraties, bekende problemen, providerconfiguratie,
-- infrastructuurregistratie en de releasechecklist blijven bestaan.
--
-- Maak vóór uitvoering een externe back-up. Leeg daarnaast in Supabase
-- Storage de buckets `receipts`, `avatars`, `trip-documents`,
-- `agency-branding` en `corporate-mail` (voor zover aanwezig). Rechtstreeks
-- uit storage.objects verwijderen ruimt de onderliggende bestanden niet op.

BEGIN;

-- Verander deze waarde alleen wanneer je werkelijk alle accounts wilt wissen.
CREATE TEMP TABLE reset_confirmation(value TEXT NOT NULL);
INSERT INTO reset_confirmation(value) VALUES ('TYPE_CONFIRMATION_HERE');

DO $$
BEGIN
  IF (SELECT value FROM reset_confirmation) <> 'DELETE_ALL_GLOBETROTR_USERS_2026' THEN
    RAISE EXCEPTION 'RESET_NOT_CONFIRMED';
  END IF;
END;
$$;

-- Toon vooraf hoeveel primaire gegevens worden verwijderd. De SQL Editor
-- laat dit resultaat zien voordat de transactie wordt afgerond.
SELECT
  (SELECT count(*) FROM auth.users) AS users,
  (SELECT count(*) FROM public.workspaces) AS workspaces,
  (SELECT count(*) FROM public.trips) AS trips,
  (SELECT count(*) FROM public.trip_expenses) AS expenses,
  (SELECT count(*) FROM public.trip_members) AS trip_members,
  (SELECT count(*) FROM public.agency_clients) AS agency_clients,
  (SELECT count(*) FROM public.beta_feedback) AS feedback_items;

-- Tabellen met een RESTRICT-verwijzing naar een gebruiker of met zelfstandige
-- bedrijfsdata worden eerst geleegd. Afhankelijke rijen volgen via CASCADE.
DELETE FROM public.corporate_mail_send_queue;
DELETE FROM public.corporate_mail_messages;
DELETE FROM public.corporate_mailbox_members;
DELETE FROM public.corporate_mailboxes;
DELETE FROM public.corporate_invoices;
DELETE FROM public.billing_webhook_events;
DELETE FROM public.billing_transactions;
DELETE FROM public.billing_subscriptions;
DELETE FROM public.billing_customers;
DELETE FROM public.platform_announcements;
DELETE FROM public.beta_feedback;

-- Offertes verwijzen beperkend naar Agency-klanten. Verwijder ze voordat de
-- workspaces en hun klanten via de accountcascade verdwijnen.
DELETE FROM public.agency_quotes;

-- Verwijder tenantdata vóór de Auth-accounts. Sommige tabellen hebben naast
-- hun workspace-cascade ook een ON DELETE SET NULL naar auth.users. Hun
-- validatietriggers staan zo'n tijdelijk half-losgekoppelde rij terecht niet
-- toe (bijvoorbeeld een Agency-taak zonder geldige verantwoordelijke).
DELETE FROM public.workspaces;

-- Dit is de eigenlijke accountreset. Profielen en resterende rechtstreeks aan
-- gebruikers gekoppelde gegevens verdwijnen via hun Auth-cascade.
DELETE FROM auth.users;

-- Oude audits blijven als technisch spoor bestaan wanneer hun actor door
-- ON DELETE SET NULL is losgekoppeld. Voor een volledig schone beta wissen we
-- ook deze historische regels en achtergebleven workerjobs.
DELETE FROM public.platform_admin_audit_log;
DELETE FROM public.worker_jobs;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users)
    OR EXISTS (SELECT 1 FROM public.workspaces)
    OR EXISTS (SELECT 1 FROM public.trips)
    OR EXISTS (SELECT 1 FROM public.trip_members)
    OR EXISTS (SELECT 1 FROM public.trip_expenses) THEN
    RAISE EXCEPTION 'RESET_INCOMPLETE';
  END IF;
END;
$$;

COMMIT;

-- Na succes:
-- 1. registreer één nieuw account via GlobeTrotr;
-- 2. vervang hieronder het e-mailadres en voer alleen het losse blok uit;
-- 3. log volledig uit en opnieuw in voor de nieuwe JWT-claim.
--
-- DO $$
-- DECLARE v_user_id UUID;
-- BEGIN
--   SELECT id INTO v_user_id
--   FROM auth.users
--   WHERE lower(email) = lower('jouw-admin@globetrotr.nl')
--   LIMIT 1;
--
--   IF v_user_id IS NULL THEN
--     RAISE EXCEPTION 'ADMIN_ACCOUNT_NOT_FOUND';
--   END IF;
--
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::JSONB)
--     || jsonb_build_object('corporate_admin', true)
--   WHERE id = v_user_id;
--
--   INSERT INTO public.platform_admins(
--     user_id, role, permissions, active, created_by
--   ) VALUES (
--     v_user_id, 'owner',
--     '{"users":true,"agencies":true,"finance":true,"mail":true,"operations":true,"issues":true}'::JSONB,
--     true, v_user_id
--   )
--   ON CONFLICT (user_id) DO UPDATE SET
--     role = EXCLUDED.role,
--     permissions = EXCLUDED.permissions,
--     active = true;
-- END;
-- $$;
