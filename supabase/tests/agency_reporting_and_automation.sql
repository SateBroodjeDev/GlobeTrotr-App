-- Uitvoeren na 20260908079000_agency_reporting_and_automation.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE ara AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'automation@example.invalid',now() FROM ara;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::jsonb FROM ara;
INSERT INTO public.agency_automation_settings(workspace_uuid,task_reminder_days,updated_by) SELECT workspace_id,5,owner_id FROM ara;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.agency_automation_settings WHERE task_reminder_days=5) THEN RAISE EXCEPTION 'Agency-automatisering ontbreekt';END IF;END $$;
ROLLBACK;
