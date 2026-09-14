-- Uitvoeren na 20260908057000_important_trip_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE itn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'important-owner@example.invalid',now() FROM itn
 UNION ALL SELECT member_id,'important-member@example.invalid',now() FROM itn;
INSERT INTO public.workspaces(user_id,data) SELECT owner_id,'{}'::JSONB FROM itn;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name,start_date,end_date)
 SELECT owner_id,trip_id::TEXT,trip_id,'Belangrijke reis',current_date,current_date+2 FROM itn;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'important-member',member_id,'Lid','important-member@example.invalid','traveler','active',now() FROM itn;
DO $$ DECLARE v_owner UUID;v_member UUID;v_trip UUID;BEGIN
 SELECT owner_id,member_id,trip_id INTO v_owner,v_member,v_trip FROM itn;
 PERFORM set_config('app.trip_actor_id',v_member::TEXT,true);
 UPDATE public.trips SET start_date=current_date+1,end_date=current_date+3,is_public=true WHERE trip_uuid=v_trip;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND event_key='trip-important:'||v_trip::TEXT AND body='settings|Belangrijke reis|dates,public') THEN RAISE EXCEPTION 'Belangrijke instellingenmelding ontbreekt';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND event_key='trip:'||v_trip::TEXT) THEN RAISE EXCEPTION 'Naast de belangrijke melding ontstond een dubbele algemene melding';END IF;
 DELETE FROM public.notifications WHERE event_key='trip-important:'||v_trip::TEXT;
 PERFORM set_config('app.trip_snapshot_write','true',true);
 INSERT INTO public.trip_stops(workspace_user_id,trip_id,trip_uuid,id,position,name,country,lat,lon)
 SELECT v_owner,v_trip::TEXT,v_trip,'snapshot-stop',0,'Ongewijzigd','Nederland',52.09,5.12;
 PERFORM set_config('app.trip_snapshot_write','false',true);
 IF EXISTS(SELECT 1 FROM public.notifications WHERE event_key='trip-important:'||v_trip::TEXT) THEN RAISE EXCEPTION 'Interne snapshotrijen veroorzaakten een onjuiste bestemmingsmelding';END IF;
 INSERT INTO public.trip_stops(workspace_user_id,trip_id,trip_uuid,id,position,name,country,lat,lon)
 SELECT v_owner,v_trip::TEXT,v_trip,'stop-test',1,'Utrecht','Nederland',52.09,5.12;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND event_key='trip-important:'||v_trip::TEXT AND body='destinations|Belangrijke reis|') THEN RAISE EXCEPTION 'Bestemmingsmelding ontbreekt';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND event_key='trip-important:'||v_trip::TEXT) THEN RAISE EXCEPTION 'Uitvoerder kreeg eigen wijzigingsmelding';END IF;
END $$;
ROLLBACK;
