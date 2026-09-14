-- Uitvoeren na 20260908058000_trip_content_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tcn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() traveler_id,
 gen_random_uuid() viewer_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at)
 SELECT owner_id,'content-owner@example.invalid',now() FROM tcn
 UNION ALL SELECT traveler_id,'content-traveler@example.invalid',now() FROM tcn
 UNION ALL SELECT viewer_id,'content-viewer@example.invalid',now() FROM tcn;
INSERT INTO public.workspaces(user_id,data) SELECT owner_id,'{}'::JSONB FROM tcn;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name) SELECT owner_id,trip_id::TEXT,trip_id,'Inhoudsreis' FROM tcn;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'traveler',traveler_id,'Reiziger','content-traveler@example.invalid','traveler','active',now() FROM tcn
 UNION ALL SELECT owner_id,trip_id::TEXT,trip_id,'viewer',viewer_id,'Lezer','content-viewer@example.invalid','viewer','active',now() FROM tcn;
DO $$ DECLARE v_owner UUID;v_traveler UUID;v_viewer UUID;v_trip UUID;BEGIN
 SELECT owner_id,traveler_id,viewer_id,trip_id INTO v_owner,v_traveler,v_viewer,v_trip FROM tcn;
 PERFORM set_config('app.trip_actor_id',v_owner::TEXT,true);
 INSERT INTO public.trip_travel_items(workspace_user_id,trip_id,trip_uuid,id,item_type,title,start_date)
 VALUES(v_owner,v_trip::TEXT,v_trip,'booking-test','activity','Museum',current_date);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_traveler AND kind='trip_booking' AND body='added|Inhoudsreis')
  OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_viewer AND kind='trip_booking') THEN RAISE EXCEPTION 'Boekingsmelding heeft onjuiste ontvangers';END IF;
 UPDATE public.trip_travel_items SET title='Museum gewijzigd' WHERE trip_uuid=v_trip AND id='booking-test';
 IF (SELECT count(*) FROM public.notifications WHERE user_id=v_traveler AND event_key='trip-bookings:'||v_trip::TEXT)<>1
  OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_traveler AND body='updated|Inhoudsreis') THEN RAISE EXCEPTION 'Boekingsmelding is niet correct gebundeld';END IF;
 INSERT INTO public.trip_expenses(workspace_user_id,trip_id,trip_uuid,id,expense_date,title,category,amount,currency,paid_by,billable,split_with)
 VALUES(v_owner,v_trip::TEXT,v_trip,'expense-test',current_date,'Diner','food',50,'EUR','Reiziger',false,'[]'::JSONB);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_traveler AND kind='trip_expense' AND body='added|Inhoudsreis')
  OR EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_viewer AND kind='trip_expense') THEN RAISE EXCEPTION 'Uitgavenmelding heeft onjuiste ontvangers';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_traveler AND event_key='trip:'||v_trip::TEXT) THEN RAISE EXCEPTION 'Gespecialiseerde wijziging gaf ook een algemene melding';END IF;
 PERFORM set_config('app.trip_snapshot_write','true',true);
 INSERT INTO public.trip_travel_items(workspace_user_id,trip_id,trip_uuid,id,item_type,title,start_date)
 VALUES(v_owner,v_trip::TEXT,v_trip,'internal-test','activity','Intern',current_date);
 PERFORM set_config('app.trip_snapshot_write','false',true);
 IF (SELECT count(*) FROM public.notifications WHERE user_id=v_traveler AND event_key='trip-bookings:'||v_trip::TEXT)<>1
  OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_traveler AND event_key='trip-bookings:'||v_trip::TEXT AND body='updated|Inhoudsreis')
  THEN RAISE EXCEPTION 'Interne snapshotrij gaf een losse melding';END IF;
END $$;
ROLLBACK;
