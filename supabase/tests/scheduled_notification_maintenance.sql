-- Uitvoeren na 20260908059000_scheduled_notification_maintenance.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE snm AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,
 gen_random_uuid() workspace_id,gen_random_uuid() trip_id,gen_random_uuid() invitation_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'schedule-owner@example.invalid',now() FROM snm
 UNION ALL SELECT member_id,'schedule-member@example.invalid',now() FROM snm;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM snm;
-- De workspace-trigger registreert de eigenaar al. Voeg alleen het extra lid toe;
-- zo blijft deze test ook geldig wanneer die trigger actief is.
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status)
 SELECT workspace_id,member_id,'advisor','active' FROM snm
 ON CONFLICT (workspace_uuid,user_id) DO UPDATE
 SET role=EXCLUDED.role,status=EXCLUDED.status;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name) SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Deadline-reis' FROM snm;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'schedule-member',member_id,'Lid','schedule-member@example.invalid','traveler','active',now() FROM snm;
INSERT INTO public.trip_invitations(id,trip_uuid,email,role,token_hash,invited_by,expires_at)
 SELECT invitation_id,trip_id,'schedule-member@example.invalid','viewer',repeat('a',64),owner_id,now()+interval '1 minute' FROM snm;
INSERT INTO public.agency_tasks(workspace_uuid,trip_uuid,assignee_user_id,title,due_date,created_by)
 SELECT workspace_id,trip_id,member_id,'Paspoort controleren',current_date+1,owner_id FROM snm;
INSERT INTO public.trip_documents(workspace_user_id,trip_id,trip_uuid,id,file_name,storage_path,document_type,expires_on)
 SELECT owner_id,trip_id::TEXT,trip_id,gen_random_uuid(),'paspoort.pdf','test/paspoort.pdf','other',current_date+20 FROM snm;
SELECT public.run_notification_maintenance(now()+interval '2 minutes');
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.notifications WHERE event_key='invitation:'||(SELECT invitation_id::TEXT FROM snm) AND dismissed_at IS NULL) THEN RAISE EXCEPTION 'Verlopen uitnodiging bleef open';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM snm) AND kind='agency_task' AND event_key LIKE 'agency-task-due:%') THEN RAISE EXCEPTION 'Taakherinnering ontbreekt';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM snm) AND kind='trip_document' AND event_key LIKE 'trip-document-expiry:%') THEN RAISE EXCEPTION 'Documentherinnering ontbreekt';END IF;
END $$;
ROLLBACK;
