-- Uitvoeren na 20260908176000_booking_departure_reminders.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_user UUID:=gen_random_uuid();
  v_trip UUID:=gen_random_uuid();
  v_result INTEGER;
BEGIN
  INSERT INTO auth.users(id,email,email_confirmed_at)
  VALUES(v_user,'booking-reminder-'||v_user||'@example.invalid',now());
  INSERT INTO public.profiles(id,locale,timezone)
  VALUES(v_user,'nl-NL','Europe/Amsterdam')
  ON CONFLICT(id) DO UPDATE SET locale='nl-NL',timezone='Europe/Amsterdam';
  INSERT INTO public.workspaces(user_id) VALUES(v_user);
  INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name)
  VALUES(v_user,v_trip::TEXT,v_trip,'Herinneringsreis');
  INSERT INTO public.trip_travel_items(
    workspace_user_id,trip_id,trip_uuid,id,item_type,title,start_date,details
  ) VALUES(
    v_user,v_trip::TEXT,v_trip,'flight-test','flight','Vlucht GT123',
    (now() AT TIME ZONE 'Europe/Amsterdam')::DATE+1,
    jsonb_build_object('startTime',to_char(
      (now() AT TIME ZONE 'Europe/Amsterdam')+interval '23 hours','HH24:MI'))
  );

  SELECT public.run_booking_departure_reminders(now()) INTO v_result;
  IF v_result<>1 OR NOT EXISTS(SELECT 1 FROM public.notifications
    WHERE user_id=v_user AND trip_uuid=v_trip AND kind='trip_booking'
      AND event_key='booking-reminder:'||v_trip::TEXT||':flight-test'
      AND title='Vlucht vertrekt binnen 24 uur'
      AND body NOT LIKE '%reference%') THEN
    RAISE EXCEPTION 'BOOKING_REMINDER_MISSING';
  END IF;
  IF public.run_booking_departure_reminders(now())<>0 THEN
    RAISE EXCEPTION 'BOOKING_REMINDER_DUPLICATED';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.booking-reminders') THEN
    RAISE EXCEPTION 'BOOKING_REMINDER_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
ROLLBACK;
