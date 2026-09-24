-- Uitvoeren na 20260908172000_notification_link_compatibility.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_notification UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link'
  ) THEN
    RAISE EXCEPTION 'NOTIFICATION_LINK_COLUMN_MISSING';
  END IF;

  INSERT INTO auth.users(id, email, email_confirmed_at)
  VALUES (v_user, 'notification-link-' || v_user || '@example.invalid', now());
  INSERT INTO public.web_push_subscriptions(user_id, endpoint, p256dh, auth_secret)
  VALUES (v_user, 'https://push.example/link-' || v_user, repeat('a', 60), repeat('b', 20));
  INSERT INTO public.notifications(user_id, kind, title, body, event_key, link)
  VALUES (v_user, 'account', 'Linktest', 'Linktest', 'notification-link:' || v_user, '/account')
  RETURNING id INTO v_notification;

  IF NOT EXISTS (
    SELECT 1 FROM public.web_push_outbox
    WHERE notification_id = v_notification AND payload->>'url' = '/account'
  ) THEN
    RAISE EXCEPTION 'NOTIFICATION_LINK_NOT_QUEUED';
  END IF;

  BEGIN
    INSERT INTO public.notifications(user_id, kind, title, body, event_key, link)
    VALUES (v_user, 'account', 'Extern', 'Extern', 'notification-external:' || v_user, 'https://evil.example');
    RAISE EXCEPTION 'EXTERNAL_NOTIFICATION_LINK_ACCEPTED';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;
ROLLBACK;
