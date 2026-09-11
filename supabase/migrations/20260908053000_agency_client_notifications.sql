-- Meld belangrijke wijzigingen aan Agency-klanten aan bevoegde medewerkers.
-- Uitvoeren na 20260908052000_trip_document_notifications.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
 CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote','agency_access','trip_document','agency_client'));

CREATE OR REPLACE FUNCTION private.notify_agency_client_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 v_client public.agency_clients%ROWTYPE;
 v_actor UUID;
 v_action TEXT;
 v_trip_name TEXT:='';
 v_user UUID;
BEGIN
 IF TG_TABLE_NAME='agency_clients' THEN
  IF TG_OP='DELETE' THEN v_client:=OLD;v_actor:=OLD.updated_by;v_action:='removed';
  ELSE
   v_client:=NEW;v_actor:=NEW.updated_by;
   IF TG_OP='INSERT' THEN v_action:='created';
   ELSIF NEW.status IS DISTINCT FROM OLD.status THEN v_action:=CASE NEW.status WHEN 'archived' THEN 'archived' ELSE 'restored' END;
   ELSIF ROW(NEW.full_name,NEW.email,NEW.phone,NEW.locale,NEW.notes,NEW.preferences)
     IS DISTINCT FROM ROW(OLD.full_name,OLD.email,OLD.phone,OLD.locale,OLD.notes,OLD.preferences) THEN v_action:='updated';
   ELSE RETURN NEW;END IF;
  END IF;
 ELSE
  IF TG_OP='DELETE' THEN
   SELECT client.* INTO v_client FROM public.agency_clients client WHERE client.id=OLD.client_id;
   v_actor:=COALESCE(v_client.updated_by,OLD.linked_by);v_action:='unlinked';
   SELECT trip.name INTO v_trip_name FROM public.trips trip WHERE trip.trip_uuid=OLD.trip_uuid;
  ELSE
   SELECT client.* INTO v_client FROM public.agency_clients client WHERE client.id=NEW.client_id;
   v_actor:=NEW.linked_by;v_action:='linked';
   SELECT trip.name INTO v_trip_name FROM public.trips trip WHERE trip.trip_uuid=NEW.trip_uuid;
  END IF;
 END IF;

 IF v_client.id IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 FOR v_user IN
  SELECT workspace.user_id FROM public.workspaces workspace WHERE workspace.workspace_uuid=v_client.workspace_uuid
  UNION
  SELECT member.user_id FROM public.workspace_members member
   WHERE member.workspace_uuid=v_client.workspace_uuid AND member.status='active'
    AND member.user_id IS NOT NULL
    AND private.agency_actor_has_permission(v_client.workspace_uuid,member.user_id,'members_manage')
 LOOP
  IF v_user IS DISTINCT FROM v_actor AND NOT EXISTS(
   SELECT 1 FROM public.agency_notification_preferences preference
    WHERE preference.workspace_uuid=v_client.workspace_uuid AND preference.user_id=v_user
     AND preference.client_updates=false
  ) THEN
   INSERT INTO public.notifications(user_id,kind,title,body,event_key)
   VALUES(v_user,'agency_client','Agency-klant gewijzigd / Agency client changed',
    v_action||'|'||left(replace(v_client.full_name,'|',''),100)||'|'||left(replace(COALESCE(v_trip_name,''),'|',''),100),
    'agency-client:'||v_client.id::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END $$;

DROP TRIGGER IF EXISTS notify_agency_client_change ON public.agency_clients;
CREATE TRIGGER notify_agency_client_change AFTER INSERT OR UPDATE OR DELETE ON public.agency_clients
 FOR EACH ROW EXECUTE FUNCTION private.notify_agency_client_change();
DROP TRIGGER IF EXISTS notify_agency_client_trip_change ON public.agency_client_trips;
CREATE TRIGGER notify_agency_client_trip_change AFTER INSERT OR DELETE ON public.agency_client_trips
 FOR EACH ROW EXECUTE FUNCTION private.notify_agency_client_change();

REVOKE ALL ON FUNCTION private.notify_agency_client_change() FROM PUBLIC,anon,authenticated;
COMMIT;
