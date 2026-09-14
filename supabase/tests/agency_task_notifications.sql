-- Uitvoeren na 20260908051000_agency_task_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE atn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() first_id,gen_random_uuid() second_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'task-owner@example.invalid',now()FROM atn UNION ALL SELECT first_id,'task-first@example.invalid',now()FROM atn UNION ALL SELECT second_id,'task-second@example.invalid',now()FROM atn;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM atn;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at)SELECT workspace_id,first_id,'advisor','active',now()FROM atn UNION ALL SELECT workspace_id,second_id,'advisor','active',now()FROM atn;
DO $$ DECLARE v_task UUID;BEGIN
 INSERT INTO public.agency_tasks(workspace_uuid,title,due_date,status,assignee_user_id,created_by,updated_by)SELECT workspace_id,'Visum controleren',current_date+5,'open',first_id,owner_id,owner_id FROM atn RETURNING id INTO v_task;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT first_id FROM atn) AND event_key='agency-task:'||v_task::TEXT AND body LIKE 'assigned|%') THEN RAISE EXCEPTION 'Toewijzingsmelding ontbreekt';END IF;
 UPDATE public.agency_tasks SET assignee_user_id=(SELECT second_id FROM atn),updated_by=(SELECT owner_id FROM atn) WHERE id=v_task;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT first_id FROM atn) AND body LIKE 'unassigned|%') OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT second_id FROM atn) AND body LIKE 'assigned|%') THEN RAISE EXCEPTION 'Overdrachtsmeldingen ontbreken';END IF;
 UPDATE public.agency_tasks SET status='done',updated_by=(SELECT owner_id FROM atn) WHERE id=v_task;
 IF (SELECT count(*) FROM public.notifications WHERE user_id=(SELECT second_id FROM atn) AND event_key='agency-task:'||v_task::TEXT)<>1 OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT second_id FROM atn) AND body LIKE 'status|%|done') THEN RAISE EXCEPTION 'Statusmelding is niet gebundeld';END IF;
END $$;
ROLLBACK;
