-- Uitvoeren na 20260908092000_trip_tasks.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tt AS SELECT gen_random_uuid() owner_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'task-owner@example.invalid',now() FROM tt;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM tt;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name) SELECT owner_id,trip_id::TEXT,trip_id,'Takenreis' FROM tt;
INSERT INTO public.trip_tasks(trip_uuid,title,assignee_name,due_date,created_by) SELECT trip_id,'Tickets downloaden','Eigenaar',current_date+2,owner_id FROM tt;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.trip_tasks WHERE title='Tickets downloaden' AND assignee_name='Eigenaar') THEN RAISE EXCEPTION 'TRIP_TASK_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.tasks') THEN RAISE EXCEPTION 'TRIP_TASK_ACCEPTANCE_MISSING'; END IF;
END $$;
ROLLBACK;
