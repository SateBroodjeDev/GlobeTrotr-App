-- Meld taaktoewijzing, overdracht, status en deadline atomair.
-- Uitvoeren na 20260908050000_agency_branding_notifications.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.notify_agency_task_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_actor UUID:=COALESCE(NEW.updated_by,NEW.created_by);v_action TEXT;
BEGIN
 IF TG_OP='UPDATE' AND ROW(NEW.assignee_user_id,NEW.title,NEW.due_date,NEW.status,NEW.priority,NEW.trip_uuid)
   IS NOT DISTINCT FROM ROW(OLD.assignee_user_id,OLD.title,OLD.due_date,OLD.status,OLD.priority,OLD.trip_uuid) THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.assignee_user_id IS NOT NULL AND OLD.assignee_user_id IS DISTINCT FROM NEW.assignee_user_id AND OLD.assignee_user_id IS DISTINCT FROM v_actor THEN
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key) VALUES(OLD.assignee_user_id,'agency_task','Agency-taak overgedragen / Agency task reassigned','unassigned|'||OLD.title,OLD.trip_uuid,'agency-task:'||NEW.id::TEXT)
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 END IF;
 IF NEW.assignee_user_id IS NOT NULL AND NEW.assignee_user_id IS DISTINCT FROM v_actor THEN
  v_action:=CASE WHEN TG_OP='INSERT' OR OLD.assignee_user_id IS DISTINCT FROM NEW.assignee_user_id THEN 'assigned' WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status' WHEN OLD.due_date IS DISTINCT FROM NEW.due_date THEN 'deadline' ELSE 'updated' END;
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key) VALUES(NEW.assignee_user_id,'agency_task','Agency-taak bijgewerkt / Agency task updated',v_action||'|'||NEW.title||'|'||COALESCE(NEW.due_date::TEXT,'')||'|'||NEW.status,NEW.trip_uuid,'agency-task:'||NEW.id::TEXT)
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_agency_task_change ON public.agency_tasks;
CREATE TRIGGER notify_agency_task_change AFTER INSERT OR UPDATE ON public.agency_tasks FOR EACH ROW EXECUTE FUNCTION private.notify_agency_task_change();
REVOKE ALL ON FUNCTION private.notify_agency_task_change() FROM PUBLIC,anon,authenticated;
COMMIT;
