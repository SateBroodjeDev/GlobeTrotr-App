-- Agency-taken, deadlines en veilige workspacebegrenzing.
-- Uitvoeren na 20260908040000_trip_document_expiry.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task'));

CREATE TABLE IF NOT EXISTS public.agency_tasks(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  client_id UUID REFERENCES public.agency_clients(id) ON DELETE SET NULL,
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 1 AND 120),
  notes TEXT CHECK(notes IS NULL OR char_length(notes)<=1000),
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','done','cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_tasks_workspace_queue_idx
  ON public.agency_tasks(workspace_uuid,status,due_date,created_at DESC);
CREATE INDEX IF NOT EXISTS agency_tasks_assignee_idx
  ON public.agency_tasks(assignee_user_id,status,due_date) WHERE assignee_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.validate_agency_task_scope()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.workspaces workspace
    WHERE workspace.workspace_uuid=NEW.workspace_uuid AND workspace.plan='agency') THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TASK_WORKSPACE_INVALID';
  END IF;
  IF NEW.trip_uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.trips trip
    WHERE trip.trip_uuid=NEW.trip_uuid AND trip.workspace_uuid=NEW.workspace_uuid) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TASK_TRIP_WORKSPACE_MISMATCH';
  END IF;
  IF NEW.client_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.agency_clients client
    WHERE client.id=NEW.client_id AND client.workspace_uuid=NEW.workspace_uuid) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TASK_CLIENT_WORKSPACE_MISMATCH';
  END IF;
  IF NEW.assignee_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.workspace_members member
    WHERE member.workspace_uuid=NEW.workspace_uuid AND member.user_id=NEW.assignee_user_id
      AND member.status='active' AND member.role IN('owner','advisor','finance')) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TASK_ASSIGNEE_WORKSPACE_MISMATCH';
  END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_agency_task_scope ON public.agency_tasks;
CREATE TRIGGER validate_agency_task_scope BEFORE INSERT OR UPDATE ON public.agency_tasks
FOR EACH ROW EXECUTE FUNCTION private.validate_agency_task_scope();

ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_tasks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.agency_tasks TO authenticated;
GRANT ALL ON public.agency_tasks TO service_role;
CREATE POLICY "Agency members read tasks" ON public.agency_tasks FOR SELECT TO authenticated
  USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_view')));
CREATE POLICY "Agency planners create tasks" ON public.agency_tasks FOR INSERT TO authenticated
  WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
CREATE POLICY "Agency planners update tasks" ON public.agency_tasks FOR UPDATE TO authenticated
  USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')))
  WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
CREATE POLICY "Agency planners delete tasks" ON public.agency_tasks FOR DELETE TO authenticated
  USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));

REVOKE ALL ON FUNCTION private.validate_agency_task_scope() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
