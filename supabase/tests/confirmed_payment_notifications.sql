-- Uitvoeren na 20260908170000_confirmed_payment_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_user UUID := gen_random_uuid();
  v_created_event TEXT := 'evt_created_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_completed_event TEXT := 'evt_completed_' || replace(gen_random_uuid()::TEXT, '-', '');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link'
  ) THEN
    RAISE EXCEPTION 'NOTIFICATION_LINK_COLUMN_MISSING';
  END IF;
  INSERT INTO auth.users(id, email, email_confirmed_at)
  VALUES (v_user, 'paddle-notification-' || v_user || '@example.invalid', now());
  INSERT INTO public.web_push_subscriptions(user_id, endpoint, p256dh, auth_secret)
  VALUES (v_user, 'https://push.example/' || v_user, repeat('a', 60), repeat('b', 20));

  INSERT INTO public.billing_webhook_events(provider_event_id, event_type, occurred_at, payload, status)
  VALUES
    (v_created_event, 'transaction.created', now(), jsonb_build_object('event_type', 'transaction.created', 'data', jsonb_build_object('status', 'ready')), 'processed'),
    (v_completed_event, 'transaction.completed', now(), jsonb_build_object('event_type', 'transaction.completed', 'data', jsonb_build_object('status', 'completed')), 'processed');

  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  VALUES (v_user, 'account', 'Betaling ontvangen', 'Onterecht', 'paddle-transaction:' || v_created_event);
  IF EXISTS (SELECT 1 FROM public.notifications WHERE event_key = 'paddle-transaction:' || v_created_event) THEN
    RAISE EXCEPTION 'PREMATURE_PAYMENT_NOTIFICATION_ACCEPTED';
  END IF;

  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  VALUES (v_user, 'account', 'Betaling ontvangen', 'Bevestigd', 'paddle-transaction:' || v_completed_event);
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE event_key = 'paddle-transaction:' || v_completed_event) THEN
    RAISE EXCEPTION 'COMPLETED_PAYMENT_NOTIFICATION_BLOCKED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.web_push_outbox
    WHERE payload->>'body' IN ('Je hebt een nieuwe melding.', 'You have a new notification.')
      AND payload->>'body' NOT LIKE '% / %'
  ) THEN
    RAISE EXCEPTION 'LOCALIZED_WEB_PUSH_MISSING';
  END IF;

  UPDATE public.notifications SET dismissed_at = now()
  WHERE event_key = 'paddle-transaction:' || v_completed_event;
  IF EXISTS (SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id = outbox.notification_id
      WHERE notification.event_key = 'paddle-transaction:' || v_completed_event
        AND outbox.status IN ('pending', 'failed')) THEN
    RAISE EXCEPTION 'DISMISSED_WEB_PUSH_NOT_CANCELLED';
  END IF;
  UPDATE public.notifications SET dismissed_at = NULL, created_at = now()
  WHERE event_key = 'paddle-transaction:' || v_completed_event;
  IF NOT EXISTS (SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id = outbox.notification_id
      WHERE notification.event_key = 'paddle-transaction:' || v_completed_event
        AND outbox.status = 'pending') THEN
    RAISE EXCEPTION 'REOPENED_WEB_PUSH_NOT_QUEUED';
  END IF;

  PERFORM public.queue_web_push_test(v_user);
  IF NOT EXISTS (SELECT 1 FROM public.notifications
      WHERE user_id = v_user AND event_key LIKE 'push-test:%')
    OR NOT EXISTS (SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id = outbox.notification_id
      WHERE notification.user_id = v_user AND notification.event_key LIKE 'push-test:%') THEN
    RAISE EXCEPTION 'WEB_PUSH_TEST_NOT_QUEUED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.web_push_outbox outbox
      JOIN public.notifications notification ON notification.id = outbox.notification_id
      WHERE notification.user_id = v_user AND notification.event_key LIKE 'push-test:%'
        AND outbox.payload->>'url' = '/dashboard') THEN
    RAISE EXCEPTION 'WEB_PUSH_TEST_LINK_MISSING';
  END IF;
  IF EXISTS (SELECT 1 FROM public.email_outbox outbox
      JOIN public.notifications notification ON notification.id = outbox.notification_id
      WHERE notification.user_id = v_user AND notification.event_key LIKE 'push-test:%') THEN
    RAISE EXCEPTION 'WEB_PUSH_TEST_EMAIL_CREATED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key = 'billing.confirmed-payment-notification') THEN
    RAISE EXCEPTION 'CONFIRMED_PAYMENT_ACCEPTANCE_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key = 'notifications.end-to-end') THEN
    RAISE EXCEPTION 'NOTIFICATION_END_TO_END_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
ROLLBACK;
