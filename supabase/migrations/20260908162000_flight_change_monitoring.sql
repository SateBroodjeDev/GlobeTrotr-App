BEGIN;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK(kind IN(
 'account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote','agency_access','trip_document','agency_client','trip_access','trip_booking','trip_expense','trip_settlement','flight_alert'));

CREATE TABLE public.flight_monitor_state(
 trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,travel_item_id TEXT NOT NULL,
 flight_number TEXT NOT NULL,flight_date DATE NOT NULL,last_state JSONB,last_fingerprint TEXT,last_checked_at TIMESTAMPTZ,
 next_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),last_change_at TIMESTAMPTZ,last_error_code TEXT,error_count SMALLINT NOT NULL DEFAULT 0 CHECK(error_count BETWEEN 0 AND 20),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(trip_uuid,travel_item_id));
CREATE INDEX flight_monitor_due_idx ON public.flight_monitor_state(next_check_at) WHERE error_count<20;
ALTER TABLE public.flight_monitor_state ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.flight_monitor_state FROM PUBLIC,anon,authenticated;GRANT ALL ON public.flight_monitor_state TO service_role;

CREATE OR REPLACE FUNCTION public.claim_due_flight_monitors(p_limit INTEGER DEFAULT 20) RETURNS TABLE(trip_uuid UUID,travel_item_id TEXT,flight_number TEXT,flight_date DATE) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.flight_monitor_state(trip_uuid,travel_item_id,flight_number,flight_date)
 SELECT i.trip_uuid,i.id,upper(regexp_replace(i.flight_number,'\s','','g')),i.start_date
 FROM public.trip_travel_items i JOIN public.trips t ON t.trip_uuid=i.trip_uuid JOIN public.workspaces w ON w.workspace_uuid=t.workspace_uuid
 WHERE i.item_type='flight' AND i.flight_number IS NOT NULL AND i.flight_number~*'^[A-Z]{2,3}\s*[0-9]{1,7}$' AND i.start_date BETWEEN current_date AND current_date+7 AND t.archived=false AND w.plan IN('pro','agency')
 ON CONFLICT(trip_uuid,travel_item_id) DO UPDATE SET flight_number=EXCLUDED.flight_number,flight_date=EXCLUDED.flight_date,updated_at=now()
 WHERE public.flight_monitor_state.flight_number IS DISTINCT FROM EXCLUDED.flight_number OR public.flight_monitor_state.flight_date IS DISTINCT FROM EXCLUDED.flight_date;
 DELETE FROM public.flight_monitor_state s WHERE NOT EXISTS(SELECT 1 FROM public.trip_travel_items i JOIN public.trips t ON t.trip_uuid=i.trip_uuid JOIN public.workspaces w ON w.workspace_uuid=t.workspace_uuid WHERE i.trip_uuid=s.trip_uuid AND i.id=s.travel_item_id AND i.item_type='flight' AND i.start_date BETWEEN current_date AND current_date+7 AND t.archived=false AND w.plan IN('pro','agency'));
 RETURN QUERY WITH due AS(SELECT s.trip_uuid,s.travel_item_id FROM public.flight_monitor_state s WHERE s.next_check_at<=now() AND s.error_count<20 ORDER BY s.next_check_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),50)),claimed AS(UPDATE public.flight_monitor_state s SET next_check_at=now()+interval '20 minutes',updated_at=now() FROM due WHERE s.trip_uuid=due.trip_uuid AND s.travel_item_id=due.travel_item_id RETURNING s.*) SELECT c.trip_uuid,c.travel_item_id,c.flight_number,c.flight_date FROM claimed c;
END $$;

CREATE OR REPLACE FUNCTION public.record_flight_monitor_result(p_trip UUID,p_item TEXT,p_state JSONB,p_error_code TEXT DEFAULT NULL) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_old public.flight_monitor_state%ROWTYPE;v_fingerprint TEXT;v_changes TEXT[]:='{}';v_user UUID;v_title TEXT;v_body TEXT;
BEGIN
 SELECT * INTO v_old FROM public.flight_monitor_state WHERE trip_uuid=p_trip AND travel_item_id=p_item FOR UPDATE;IF NOT FOUND THEN RETURN 'missing';END IF;
 IF p_error_code IS NOT NULL THEN UPDATE public.flight_monitor_state SET last_checked_at=now(),last_error_code=left(p_error_code,80),error_count=LEAST(error_count+1,20),next_check_at=now()+make_interval(secs=>LEAST(21600,300*(2^LEAST(error_count,6)))),updated_at=now() WHERE trip_uuid=p_trip AND travel_item_id=p_item;RETURN 'failed';END IF;
 IF jsonb_typeof(p_state)<>'object' OR pg_column_size(p_state)>4096 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='FLIGHT_STATE_INVALID';END IF;
 v_fingerprint:=md5(p_state::text);
 IF v_old.last_fingerprint IS NOT NULL AND v_old.last_fingerprint<>v_fingerprint THEN
  IF p_state->>'status' IS DISTINCT FROM v_old.last_state->>'status' THEN v_changes:=array_append(v_changes,'status');END IF;
  IF p_state#>>'{departure,scheduled}' IS DISTINCT FROM v_old.last_state#>>'{departure,scheduled}' OR p_state#>>'{departure,actual}' IS DISTINCT FROM v_old.last_state#>>'{departure,actual}' OR p_state#>>'{departure,estimated}' IS DISTINCT FROM v_old.last_state#>>'{departure,estimated}' OR p_state#>>'{arrival,scheduled}' IS DISTINCT FROM v_old.last_state#>>'{arrival,scheduled}' OR p_state#>>'{arrival,actual}' IS DISTINCT FROM v_old.last_state#>>'{arrival,actual}' OR p_state#>>'{arrival,estimated}' IS DISTINCT FROM v_old.last_state#>>'{arrival,estimated}' THEN v_changes:=array_append(v_changes,'time');END IF;
  IF p_state#>>'{departure,gate}' IS DISTINCT FROM v_old.last_state#>>'{departure,gate}' OR p_state#>>'{arrival,gate}' IS DISTINCT FROM v_old.last_state#>>'{arrival,gate}' THEN v_changes:=array_append(v_changes,'gate');END IF;
  IF p_state#>>'{departure,terminal}' IS DISTINCT FROM v_old.last_state#>>'{departure,terminal}' OR p_state#>>'{arrival,terminal}' IS DISTINCT FROM v_old.last_state#>>'{arrival,terminal}' THEN v_changes:=array_append(v_changes,'terminal');END IF;
  IF cardinality(v_changes)>0 AND (v_old.last_change_at IS NULL OR v_old.last_change_at<now()-interval '10 minutes') THEN
   v_title:='Vluchtwijziging / Flight update';v_body:='flight|'||v_old.flight_number||'|'||array_to_string(v_changes,',');
   FOR v_user IN SELECT DISTINCT x.user_id FROM(SELECT t.workspace_user_id user_id FROM public.trips t WHERE t.trip_uuid=p_trip UNION ALL SELECT m.user_id FROM public.trip_members m WHERE m.trip_uuid=p_trip AND m.status='active' AND m.user_id IS NOT NULL)x WHERE NOT EXISTS(SELECT 1 FROM public.trip_notification_preferences p WHERE p.trip_uuid=p_trip AND p.user_id=x.user_id AND NOT p.flight_alerts)
   LOOP INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)VALUES(v_user,'flight_alert',v_title,v_body,p_trip,'flight-alert:'||p_item||':'||v_fingerprint)ON CONFLICT(user_id,event_key)DO NOTHING;END LOOP;
   UPDATE public.flight_monitor_state SET last_change_at=now() WHERE trip_uuid=p_trip AND travel_item_id=p_item;
  END IF;
 END IF;
 UPDATE public.flight_monitor_state SET last_state=p_state,last_fingerprint=v_fingerprint,last_checked_at=now(),next_check_at=now()+CASE WHEN flight_date<=current_date+1 THEN interval '15 minutes' ELSE interval '2 hours' END,last_error_code=NULL,error_count=0,updated_at=now() WHERE trip_uuid=p_trip AND travel_item_id=p_item;
 RETURN CASE WHEN v_old.last_fingerprint IS NULL THEN 'baseline' WHEN v_old.last_fingerprint=v_fingerprint THEN 'unchanged' WHEN cardinality(v_changes)>0 THEN 'changed' ELSE 'unchanged' END;
END $$;

CREATE OR REPLACE FUNCTION private.apply_trip_notification_preferences() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_preferences public.trip_notification_preferences%ROWTYPE;BEGIN IF NEW.trip_uuid IS NULL OR NEW.kind NOT IN('trip_change','trip_booking','trip_expense','trip_document','flight_alert') THEN RETURN NEW;END IF;SELECT * INTO v_preferences FROM public.trip_notification_preferences WHERE trip_uuid=NEW.trip_uuid AND user_id=NEW.user_id;IF NOT FOUND THEN RETURN NEW;END IF;IF(NEW.kind='trip_change' AND NOT v_preferences.planning)OR(NEW.kind='trip_booking' AND NOT v_preferences.bookings)OR(NEW.kind='trip_expense' AND NOT v_preferences.expenses)OR(NEW.kind='trip_document' AND NOT v_preferences.documents)OR(NEW.kind='flight_alert' AND NOT v_preferences.flight_alerts)THEN RETURN NULL;END IF;RETURN NEW;END $$;

REVOKE ALL ON FUNCTION public.claim_due_flight_monitors(INTEGER),public.record_flight_monitor_result(UUID,TEXT,JSONB,TEXT) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.claim_due_flight_monitors(INTEGER),public.record_flight_monitor_result(UUID,TEXT,JSONB,TEXT) TO service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)VALUES('notifications.flight-monitoring','Meldingen','Pro/Agency-vluchten begrensd controleren; alleen status-, tijd-, gate-, terminal- en annuleringswijzigingen zonder duplicaten melden','Check Pro/Agency flights within a bounded window; notify status, time, gate, terminal and cancellation changes without duplicates',475)ON CONFLICT(item_key)DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';COMMIT;
