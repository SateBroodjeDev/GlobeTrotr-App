-- Uitvoeren na 20260908041000_agency_tasks.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE task_test_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() advisor_id,
  gen_random_uuid() finance_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id,
  gen_random_uuid() other_workspace_id,gen_random_uuid() trip_id,gen_random_uuid() other_trip_id;
GRANT SELECT ON task_test_ids TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id,'task-owner@example.invalid',now() FROM task_test_ids UNION ALL
SELECT advisor_id,'task-advisor@example.invalid',now() FROM task_test_ids UNION ALL
SELECT finance_id,'task-finance@example.invalid',now() FROM task_test_ids UNION ALL
SELECT outsider_id,'task-outsider@example.invalid',now() FROM task_test_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)
SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM task_test_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at)
SELECT workspace_id,advisor_id,'advisor','active',now() FROM task_test_ids UNION ALL
SELECT workspace_id,finance_id,'finance','active',now() FROM task_test_ids;
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions)
SELECT workspace_id,'advisor','{"trips_view":true,"trips_plan":true}'::JSONB FROM task_test_ids UNION ALL
SELECT workspace_id,'finance','{"trips_view":true,"trips_plan":false}'::JSONB FROM task_test_ids
ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)
SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Taakreis' FROM task_test_ids;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',advisor_id::TEXT,true) FROM task_test_ids;
INSERT INTO public.agency_tasks(workspace_uuid,trip_uuid,assignee_user_id,title,due_date,created_by,updated_by)
SELECT workspace_id,trip_id,advisor_id,'Boeking controleren',current_date+2,advisor_id,advisor_id FROM task_test_ids;
DO $$ BEGIN IF (SELECT count(*) FROM public.agency_tasks)<>1 THEN RAISE EXCEPTION 'Adviseur kon geen taak beheren'; END IF; END $$;

SELECT set_config('request.jwt.claim.sub',finance_id::TEXT,true) FROM task_test_ids;
DO $$ DECLARE task_id UUID; BEGIN
  IF (SELECT count(*) FROM public.agency_tasks)<>1 THEN RAISE EXCEPTION 'Finance kan taken niet lezen'; END IF;
  SELECT id INTO task_id FROM public.agency_tasks;
  UPDATE public.agency_tasks SET title='Onbevoegde wijziging' WHERE id=task_id;
  IF EXISTS(SELECT 1 FROM public.agency_tasks WHERE id=task_id AND title='Onbevoegde wijziging') THEN RAISE EXCEPTION 'Finance kon taak wijzigen zonder planrecht'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',outsider_id::TEXT,true) FROM task_test_ids;
DO $$ BEGIN IF (SELECT count(*) FROM public.agency_tasks)<>0 THEN RAISE EXCEPTION 'Taak lekt naar buitenstaander'; END IF; END $$;
RESET ROLE;

DO $$ DECLARE workspace UUID;trip UUID;outsider UUID; BEGIN
  SELECT workspace_id,trip_id,outsider_id INTO workspace,trip,outsider FROM task_test_ids;
  BEGIN
    INSERT INTO public.agency_tasks(workspace_uuid,trip_uuid,assignee_user_id,title)
    VALUES(workspace,trip,outsider,'Verkeerde toewijzing');
    RAISE EXCEPTION 'Buitenstaander werd als uitvoerder geaccepteerd';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;
ROLLBACK;
