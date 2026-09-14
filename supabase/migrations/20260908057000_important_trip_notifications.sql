-- Leg de echte wijzigende gebruiker vast tijdens snapshotopslag en meld
-- belangrijke reisinstellingen afzonderlijk zonder dubbele algemene melding.
-- Uitvoeren na 20260908056000_trip_access_notifications.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.current_trip_actor(p_owner UUID)
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_value TEXT;
BEGIN
 v_value:=NULLIF(current_setting('app.trip_actor_id',true),'');
 BEGIN RETURN COALESCE(v_value::UUID,auth.uid(),p_owner);
 EXCEPTION WHEN invalid_text_representation THEN RETURN COALESCE(auth.uid(),p_owner);END;
END $$;

CREATE OR REPLACE FUNCTION private.upsert_important_trip_notification(p_trip UUID,p_action TEXT,p_details TEXT DEFAULT '')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_owner UUID;v_workspace UUID;v_actor UUID;v_name TEXT;v_user UUID;
BEGIN
 SELECT trip.workspace_user_id,trip.workspace_uuid,trip.name INTO v_owner,v_workspace,v_name
 FROM public.trips trip WHERE trip.trip_uuid=p_trip;
 IF NOT FOUND THEN RETURN;END IF;
 v_actor:=private.current_trip_actor(v_owner);
 FOR v_user IN
  SELECT v_owner
  UNION SELECT member.user_id FROM public.trip_members member
   WHERE member.trip_uuid=p_trip AND member.status='active' AND member.user_id IS NOT NULL
  UNION SELECT member.user_id FROM public.workspace_members member
   WHERE member.workspace_uuid=v_workspace AND member.status='active' AND member.user_id IS NOT NULL
    AND private.agency_actor_has_permission(v_workspace,member.user_id,'trips_view')
 LOOP
  IF v_user IS DISTINCT FROM v_actor AND NOT EXISTS(
   SELECT 1 FROM public.agency_notification_preferences preference
   WHERE preference.workspace_uuid=v_workspace AND preference.user_id=v_user AND preference.trip_changes=false
  ) THEN
   INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
   VALUES(v_user,'trip_change','Belangrijke reiswijziging / Important trip change',
    p_action||'|'||left(replace(v_name,'|',''),30)||'|'||p_details,p_trip,'trip-important:'||p_trip::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.save_trip_snapshot_versioned_as(
 p_workspace_user_id UUID,p_actor_user_id UUID,p_trip JSONB
) RETURNS TABLE(trip_uuid UUID,revision TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip_uuid UUID;v_workspace UUID;v_before_stops JSONB;v_after_stops JSONB;
BEGIN
 BEGIN v_trip_uuid:=(p_trip->>'id')::UUID;
 EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_TRIP';END;
 SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip
 WHERE trip.trip_uuid=v_trip_uuid AND trip.workspace_user_id=p_workspace_user_id;
 IF NOT FOUND OR p_actor_user_id IS NULL OR NOT(
  p_actor_user_id=p_workspace_user_id
  OR EXISTS(SELECT 1 FROM public.trip_members member WHERE member.trip_uuid=v_trip_uuid AND member.user_id=p_actor_user_id AND member.status='active')
  OR EXISTS(SELECT 1 FROM public.workspace_members member WHERE member.workspace_uuid=v_workspace AND member.user_id=p_actor_user_id AND member.status='active')
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='TRIP_ACCESS_REQUIRED';END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_array(stop.id,stop.position,stop.name,stop.country,
  stop.lat,stop.lon,stop.arrive_date,stop.nights) ORDER BY stop.position,stop.id),'[]'::JSONB)
 INTO v_before_stops FROM public.trip_stops stop WHERE stop.trip_uuid=v_trip_uuid;
 PERFORM set_config('app.trip_actor_id',p_actor_user_id::TEXT,true);
 PERFORM set_config('app.trip_snapshot_write','true',true);
 RETURN QUERY SELECT saved.trip_uuid,saved.revision
 FROM public.save_trip_snapshot_versioned(p_workspace_user_id,p_trip) saved;
 PERFORM set_config('app.trip_snapshot_write','false',true);
 SELECT COALESCE(jsonb_agg(jsonb_build_array(stop.id,stop.position,stop.name,stop.country,
  stop.lat,stop.lon,stop.arrive_date,stop.nights) ORDER BY stop.position,stop.id),'[]'::JSONB)
 INTO v_after_stops FROM public.trip_stops stop WHERE stop.trip_uuid=v_trip_uuid;
 IF v_before_stops IS DISTINCT FROM v_after_stops THEN
  PERFORM private.upsert_important_trip_notification(v_trip_uuid,'destinations','');
 END IF;
END $$;

CREATE OR REPLACE FUNCTION private.notify_trip_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip UUID;v_owner UUID;v_actor UUID;v_name TEXT;v_actor_name TEXT;
BEGIN
 IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN RETURN NULL;END IF;
 IF TG_TABLE_NAME='trip_stops' THEN RETURN NULL;END IF;
 IF TG_TABLE_NAME='trips' AND ROW(NEW.start_date,NEW.end_date,NEW.is_public,NEW.share_pin_hash,NEW.share_financials)
  IS DISTINCT FROM ROW(OLD.start_date,OLD.end_date,OLD.is_public,OLD.share_pin_hash,OLD.share_financials) THEN RETURN NULL;END IF;
 IF TG_OP='DELETE' THEN v_trip:=OLD.trip_uuid;ELSE v_trip:=NEW.trip_uuid;END IF;
 SELECT workspace_user_id,name INTO v_owner,v_name FROM public.trips WHERE trip_uuid=v_trip;
 IF NOT FOUND THEN RETURN NULL;END IF;
 v_actor:=private.current_trip_actor(v_owner);
 SELECT COALESCE(NULLIF(display_name,''),'Een reisgenoot') INTO v_actor_name FROM public.profiles WHERE id=v_actor;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 SELECT DISTINCT member.user_id,'trip_change','Reis bijgewerkt',COALESCE(v_actor_name,'Een reisgenoot')||' heeft '||v_name||' gewijzigd.',v_trip,'trip:'||v_trip::TEXT
 FROM public.trip_members member WHERE member.trip_uuid=v_trip AND member.status='active' AND member.user_id IS NOT NULL AND member.user_id<>v_actor
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION private.notify_important_trip_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip UUID;v_details TEXT:='';
BEGIN
 IF TG_TABLE_NAME='trips' THEN
  IF ROW(NEW.start_date,NEW.end_date,NEW.is_public,NEW.share_pin_hash,NEW.share_financials)
   IS NOT DISTINCT FROM ROW(OLD.start_date,OLD.end_date,OLD.is_public,OLD.share_pin_hash,OLD.share_financials) THEN RETURN NEW;END IF;
  v_trip:=NEW.trip_uuid;
  IF ROW(NEW.start_date,NEW.end_date) IS DISTINCT FROM ROW(OLD.start_date,OLD.end_date) THEN v_details:=v_details||'dates,';END IF;
  IF NEW.is_public IS DISTINCT FROM OLD.is_public THEN v_details:=v_details||'public,';END IF;
  IF NEW.share_pin_hash IS DISTINCT FROM OLD.share_pin_hash THEN v_details:=v_details||'pin,';END IF;
  IF NEW.share_financials IS DISTINCT FROM OLD.share_financials THEN v_details:=v_details||'financials,';END IF;
  PERFORM private.upsert_important_trip_notification(v_trip,'settings',trim(trailing ',' FROM v_details));
 ELSE
  IF current_setting('app.trip_snapshot_write',true)='true' THEN
   IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
  END IF;
  v_trip:=CASE WHEN TG_OP='DELETE' THEN OLD.trip_uuid ELSE NEW.trip_uuid END;
  PERFORM private.upsert_important_trip_notification(v_trip,'destinations','');
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END $$;

DROP TRIGGER IF EXISTS trips_notify_important_change ON public.trips;
CREATE TRIGGER trips_notify_important_change AFTER UPDATE OF start_date,end_date,is_public,share_pin_hash,share_financials ON public.trips
 FOR EACH ROW EXECUTE FUNCTION private.notify_important_trip_change();
DROP TRIGGER IF EXISTS trip_stops_notify_important_change ON public.trip_stops;
CREATE TRIGGER trip_stops_notify_important_change AFTER INSERT OR UPDATE OR DELETE ON public.trip_stops
 FOR EACH ROW EXECUTE FUNCTION private.notify_important_trip_change();

REVOKE ALL ON FUNCTION public.save_trip_snapshot_versioned_as(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot_versioned_as(UUID,UUID,JSONB) TO service_role;
REVOKE ALL ON FUNCTION private.current_trip_actor(UUID),private.upsert_important_trip_notification(UUID,TEXT,TEXT),private.notify_important_trip_change() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
