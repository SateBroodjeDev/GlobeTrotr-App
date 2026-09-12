-- Uitvoeren na 20260908061000_trip_notification_preferences.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tnp AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,gen_random_uuid() outsider_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'pref-owner@example.invalid',now() FROM tnp UNION ALL SELECT member_id,'pref-member@example.invalid',now() FROM tnp UNION ALL SELECT outsider_id,'pref-outsider@example.invalid',now() FROM tnp;
INSERT INTO public.workspaces(user_id,data) SELECT owner_id,'{}'::JSONB FROM tnp;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name) SELECT owner_id,trip_id::TEXT,trip_id,'Voorkeurreis' FROM tnp;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'pref-member',member_id,'Lid','pref-member@example.invalid','traveler','active',now() FROM tnp;
DO $$ DECLARE o UUID;m UUID;x UUID;t UUID;p JSONB;BEGIN
 SELECT owner_id,member_id,outsider_id,trip_id INTO o,m,x,t FROM tnp;
 IF NOT public.save_trip_notification_preferences(m,t,'{"planning":false,"bookings":true,"expenses":false,"documents":true,"flightAlerts":true}'::JSONB) THEN RAISE EXCEPTION 'Voorkeuren niet opgeslagen';END IF;
 SELECT public.get_trip_notification_preferences(m,t) INTO p;
 IF (p->>'planning')::BOOLEAN OR (p->>'expenses')::BOOLEAN THEN RAISE EXCEPTION 'Voorkeuren onjuist teruggelezen';END IF;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key) VALUES(m,'trip_change','Test','Test',t,'pref-planning');
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key) VALUES(m,'trip_booking','Test','Test',t,'pref-booking');
 IF EXISTS(SELECT 1 FROM public.notifications WHERE event_key='pref-planning') OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE event_key='pref-booking') THEN RAISE EXCEPTION 'Filter werkt niet per onderwerp';END IF;
 BEGIN PERFORM public.get_trip_notification_preferences(x,t);RAISE EXCEPTION 'Buitenstaander kreeg toegang';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
