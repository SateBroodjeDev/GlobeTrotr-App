-- Meld documentwijzigingen aan reisleden zonder documentinhoud te kopiëren.
-- Uitvoeren na 20260908051000_agency_task_notifications.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
 CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote','agency_access','trip_document'));

ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION private.set_trip_document_actor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL THEN
  NEW.updated_by:=auth.uid();
  IF TG_OP='INSERT' THEN NEW.created_by:=auth.uid();END IF;
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_trip_document_actor ON public.trip_documents;
CREATE TRIGGER set_trip_document_actor BEFORE INSERT OR UPDATE ON public.trip_documents
 FOR EACH ROW EXECUTE FUNCTION private.set_trip_document_actor();
REVOKE ALL ON FUNCTION private.set_trip_document_actor() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.notify_trip_document_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_doc public.trip_documents%ROWTYPE;v_actor UUID;v_action TEXT;v_user UUID;v_name TEXT;
BEGIN
 IF TG_OP='DELETE' THEN
  v_doc:=OLD;
  v_actor:=COALESCE(auth.uid(),OLD.updated_by);
 ELSE
  v_doc:=NEW;
  v_actor:=COALESCE(auth.uid(),NEW.updated_by);
 END IF;
 v_name:=left(replace(v_doc.file_name,'|',''),200);
 IF TG_OP='INSERT' THEN v_action:='added';
 ELSIF TG_OP='DELETE' THEN v_action:='removed';
 ELSIF NEW.expires_on IS DISTINCT FROM OLD.expires_on THEN v_action:='expiry';
 ELSIF ROW(NEW.document_type,NEW.travel_item_id) IS DISTINCT FROM ROW(OLD.document_type,OLD.travel_item_id) THEN v_action:='updated';
 ELSE IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 FOR v_user IN
  SELECT trip.workspace_user_id FROM public.trips trip WHERE trip.trip_uuid=v_doc.trip_uuid
  UNION SELECT member.user_id FROM public.trip_members member WHERE member.trip_uuid=v_doc.trip_uuid AND member.status='active' AND member.user_id IS NOT NULL
  UNION SELECT member.user_id FROM public.workspace_members member JOIN public.trips trip ON trip.workspace_uuid=member.workspace_uuid WHERE trip.trip_uuid=v_doc.trip_uuid AND member.status='active' AND member.user_id IS NOT NULL AND private.agency_actor_has_permission(trip.workspace_uuid,member.user_id,'trips_view')
 LOOP
  IF v_user IS DISTINCT FROM v_actor AND NOT EXISTS(SELECT 1 FROM public.trips trip JOIN public.agency_notification_preferences preference ON preference.workspace_uuid=trip.workspace_uuid AND preference.user_id=v_user WHERE trip.trip_uuid=v_doc.trip_uuid AND preference.trip_changes=false) THEN
   INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key) VALUES(v_user,'trip_document','Reisdocument gewijzigd / Trip document changed',v_action||'|'||v_name||'|'||COALESCE(v_doc.expires_on::TEXT,''),v_doc.trip_uuid,'trip-document:'||v_doc.id::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END $$;

DROP TRIGGER IF EXISTS notify_trip_document_change ON public.trip_documents;
CREATE TRIGGER notify_trip_document_change AFTER INSERT OR UPDATE OR DELETE ON public.trip_documents FOR EACH ROW EXECUTE FUNCTION private.notify_trip_document_change();
REVOKE ALL ON FUNCTION private.notify_trip_document_change() FROM PUBLIC,anon,authenticated;
COMMIT;
