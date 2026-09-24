-- Uitvoeren na 20260908173000_web_push_preferences.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_user UUID:=gen_random_uuid();
  v_kinds TEXT[]:=ARRAY['invitation','trip_change','trip_settlement','flight_alert','account'];
  v_kind TEXT;
  v_index INTEGER:=0;
BEGIN
  INSERT INTO auth.users(id,email,email_confirmed_at)
  VALUES(v_user,'push-preferences-'||v_user||'@example.invalid',now());
  INSERT INTO public.profiles(id,notification_preferences)
  VALUES(v_user,'{}'::JSONB)
  ON CONFLICT(id) DO UPDATE SET notification_preferences='{}'::JSONB;
  INSERT INTO public.web_push_subscriptions(user_id,endpoint,p256dh,auth_secret)
  VALUES(v_user,'https://push.example/'||v_user,repeat('a',60),repeat('b',20));

  FOREACH v_kind IN ARRAY v_kinds LOOP
    v_index:=v_index+1;
    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    VALUES(v_user,v_kind,'Test','Test','push-preference-before:'||v_index);
  END LOOP;
  IF (SELECT count(*) FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id=outbox.notification_id
      WHERE notification.user_id=v_user AND outbox.status='pending')<>5 THEN
    RAISE EXCEPTION 'DEFAULT_PUSH_CATEGORIES_NOT_QUEUED';
  END IF;

  UPDATE public.profiles SET notification_preferences=jsonb_build_object(
    'pushInvitations',false,'pushTripUpdates',false,'pushPayments',false,
    'pushFlightAlerts',false,'pushAccountService',false)
  WHERE id=v_user;
  IF EXISTS(SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id=outbox.notification_id
      WHERE notification.user_id=v_user AND outbox.status IN('pending','failed')) THEN
    RAISE EXCEPTION 'DISABLED_PUSH_NOT_CANCELLED';
  END IF;

  v_index:=0;
  FOREACH v_kind IN ARRAY v_kinds LOOP
    v_index:=v_index+1;
    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    VALUES(v_user,v_kind,'Test','Test','push-preference-after:'||v_index);
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id=outbox.notification_id
      WHERE notification.user_id=v_user AND notification.event_key LIKE 'push-preference-after:%') THEN
    RAISE EXCEPTION 'DISABLED_PUSH_QUEUED';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='notifications.push-preferences') THEN
    RAISE EXCEPTION 'PUSH_PREFERENCES_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
ROLLBACK;
