-- Uitvoeren na 20260908080000_apply_agency_automation_settings.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE aam AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'automation-maintenance@example.invalid',now() FROM aam;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::jsonb FROM aam;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name) SELECT owner_id,workspace_id,trip_id::text,trip_id,'Automatiseringsreis' FROM aam;
INSERT INTO public.agency_tasks(workspace_uuid,assignee_user_id,title,due_date,created_by) SELECT workspace_id,owner_id,'Later herinneren',current_date+5,owner_id FROM aam;
INSERT INTO public.agency_automation_settings(workspace_uuid,task_reminder_days,updated_by) SELECT workspace_id,7,owner_id FROM aam;
SELECT public.run_notification_maintenance(now());
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE event_key LIKE 'agency-task-due:%' AND user_id=(SELECT owner_id FROM aam)) THEN RAISE EXCEPTION 'Configureerbare taakherinnering ontbreekt';END IF;END $$;
ROLLBACK;
