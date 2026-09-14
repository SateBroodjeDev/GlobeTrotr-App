-- Persoonlijke, reisgebonden voorkeuren voor informatieve meldingen.
-- Uitvoeren na 20260908060000_trip_settlement_notifications.sql.
BEGIN;

CREATE TABLE public.trip_notification_preferences(
 trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 planning BOOLEAN NOT NULL DEFAULT true,
 bookings BOOLEAN NOT NULL DEFAULT true,
 expenses BOOLEAN NOT NULL DEFAULT true,
 documents BOOLEAN NOT NULL DEFAULT true,
 flight_alerts BOOLEAN NOT NULL DEFAULT true,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(trip_uuid,user_id)
);
ALTER TABLE public.trip_notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_notification_preferences FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_notification_preferences TO service_role;

CREATE OR REPLACE FUNCTION private.has_trip_notification_access(p_user UUID,p_trip UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.trips t WHERE t.trip_uuid=p_trip AND t.workspace_user_id=p_user)
 OR EXISTS(SELECT 1 FROM public.trip_members m WHERE m.trip_uuid=p_trip AND m.user_id=p_user AND m.status='active')
 OR EXISTS(SELECT 1 FROM public.trips t JOIN public.workspace_members m ON m.workspace_uuid=t.workspace_uuid
   WHERE t.trip_uuid=p_trip AND m.user_id=p_user AND m.status='active');
$$;

CREATE OR REPLACE FUNCTION public.get_trip_notification_preferences(p_actor_id UUID,p_trip_uuid UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row public.trip_notification_preferences%ROWTYPE;
BEGIN
 IF NOT private.has_trip_notification_access(p_actor_id,p_trip_uuid) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='TRIP_ACCESS_REQUIRED';END IF;
 INSERT INTO public.trip_notification_preferences(trip_uuid,user_id) VALUES(p_trip_uuid,p_actor_id) ON CONFLICT DO NOTHING;
 SELECT * INTO v_row FROM public.trip_notification_preferences WHERE trip_uuid=p_trip_uuid AND user_id=p_actor_id;
 RETURN jsonb_build_object('planning',v_row.planning,'bookings',v_row.bookings,'expenses',v_row.expenses,'documents',v_row.documents,'flightAlerts',v_row.flight_alerts);
END $$;

CREATE OR REPLACE FUNCTION public.save_trip_notification_preferences(p_actor_id UUID,p_trip_uuid UUID,p_preferences JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT private.has_trip_notification_access(p_actor_id,p_trip_uuid) OR jsonb_typeof(p_preferences)<>'object'
  OR jsonb_typeof(p_preferences->'planning')<>'boolean' OR jsonb_typeof(p_preferences->'bookings')<>'boolean'
  OR jsonb_typeof(p_preferences->'expenses')<>'boolean' OR jsonb_typeof(p_preferences->'documents')<>'boolean'
  OR jsonb_typeof(p_preferences->'flightAlerts')<>'boolean' THEN RETURN false;END IF;
 INSERT INTO public.trip_notification_preferences(trip_uuid,user_id,planning,bookings,expenses,documents,flight_alerts,updated_at)
 VALUES(p_trip_uuid,p_actor_id,(p_preferences->>'planning')::BOOLEAN,(p_preferences->>'bookings')::BOOLEAN,
  (p_preferences->>'expenses')::BOOLEAN,(p_preferences->>'documents')::BOOLEAN,(p_preferences->>'flightAlerts')::BOOLEAN,now())
 ON CONFLICT(trip_uuid,user_id) DO UPDATE SET planning=EXCLUDED.planning,bookings=EXCLUDED.bookings,
  expenses=EXCLUDED.expenses,documents=EXCLUDED.documents,flight_alerts=EXCLUDED.flight_alerts,updated_at=now();
 UPDATE public.notifications SET dismissed_at=COALESCE(dismissed_at,now()) WHERE user_id=p_actor_id AND trip_uuid=p_trip_uuid AND dismissed_at IS NULL AND(
  (kind='trip_change' AND NOT (p_preferences->>'planning')::BOOLEAN) OR
  (kind='trip_booking' AND NOT (p_preferences->>'bookings')::BOOLEAN) OR
  (kind='trip_expense' AND NOT (p_preferences->>'expenses')::BOOLEAN) OR
  (kind='trip_document' AND NOT (p_preferences->>'documents')::BOOLEAN));
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.apply_trip_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_preferences public.trip_notification_preferences%ROWTYPE;
BEGIN
 IF NEW.trip_uuid IS NULL OR NEW.kind NOT IN('trip_change','trip_booking','trip_expense','trip_document') THEN RETURN NEW;END IF;
 SELECT * INTO v_preferences FROM public.trip_notification_preferences WHERE trip_uuid=NEW.trip_uuid AND user_id=NEW.user_id;
 IF NOT FOUND THEN RETURN NEW;END IF;
 IF (NEW.kind='trip_change' AND NOT v_preferences.planning)
  OR (NEW.kind='trip_booking' AND NOT v_preferences.bookings)
  OR (NEW.kind='trip_expense' AND NOT v_preferences.expenses)
  OR (NEW.kind='trip_document' AND NOT v_preferences.documents) THEN RETURN NULL;END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS apply_trip_notification_preferences ON public.notifications;
CREATE TRIGGER apply_trip_notification_preferences BEFORE INSERT OR UPDATE ON public.notifications
 FOR EACH ROW EXECUTE FUNCTION private.apply_trip_notification_preferences();

REVOKE ALL ON FUNCTION private.has_trip_notification_access(UUID,UUID),private.apply_trip_notification_preferences() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_trip_notification_preferences(UUID,UUID),public.save_trip_notification_preferences(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_notification_preferences(UUID,UUID),public.save_trip_notification_preferences(UUID,UUID,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
