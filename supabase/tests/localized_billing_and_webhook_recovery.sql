-- Uitvoeren na 20260908135000_localized_billing_and_webhook_recovery.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_nl UUID := gen_random_uuid();
  v_en UUID := gen_random_uuid();
  v_event TEXT := 'evt_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_stale_event TEXT := 'evt_' || replace(gen_random_uuid()::TEXT, '-', '');
BEGIN
  INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
    (v_nl,'billing-nl@example.invalid',now()),
    (v_en,'billing-en@example.invalid',now());
  INSERT INTO public.profiles(id,email,locale) VALUES
    (v_nl,'billing-nl@example.invalid','nl-NL'),
    (v_en,'billing-en@example.invalid','en-GB')
  ON CONFLICT(id) DO UPDATE SET locale=EXCLUDED.locale;

  INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES
    (v_nl,'account','Betaling ontvangen / Payment received',
      'Betaling ontvangen. / Payment received.','paddle-transaction:test-nl'),
    (v_en,'account','Betaling ontvangen / Payment received',
      'Betaling ontvangen. / Payment received.','paddle-transaction:test-en');
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=v_nl
      AND title='Betaling ontvangen' AND body='Betaling ontvangen.')
    OR NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=v_en
      AND title='Payment received' AND body='Payment received.') THEN
    RAISE EXCEPTION 'PADDLE_NOTIFICATION_NOT_LOCALIZED';
  END IF;

  INSERT INTO public.billing_webhook_events(
    provider_event_id,event_type,occurred_at,payload,status,attempts,last_error_code
  ) VALUES (
    v_event,'transaction.completed',now(),jsonb_build_object('data',jsonb_build_object(
      'custom_data',jsonb_build_object('checkout_binding','test.binding'))),
    'failed',10,'23514:new row violates check constraint "billing_transactions_check1"'
  );
  -- Re-run the narrowly-scoped production repair inside this rollback test.
  UPDATE public.billing_webhook_events SET status='failed',attempts=0,processed_at=NULL
  WHERE provider='paddle' AND status='failed' AND event_type='transaction.completed'
    AND last_error_code LIKE '23514:%billing_transactions_check1%'
    AND payload->'data'->'custom_data'->>'checkout_binding' IS NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM public.billing_webhook_events
    WHERE provider_event_id=v_event AND status='failed' AND attempts=0) THEN
    RAISE EXCEPTION 'PADDLE_WEBHOOK_NOT_REQUEUED';
  END IF;
  INSERT INTO public.billing_webhook_events(
    provider_event_id,event_type,occurred_at,received_at,payload,status,attempts
  ) VALUES (v_stale_event,'transaction.completed',now()-interval '1 hour',
    now()-interval '1 hour','{}'::JSONB,'processing',1);
  UPDATE public.billing_webhook_events
  SET status='failed',last_error_code='WEBHOOK_PROCESSING_INTERRUPTED'
  WHERE provider='paddle' AND status='processing'
    AND received_at<now()-interval '10 minutes';
  IF NOT EXISTS (SELECT 1 FROM public.billing_webhook_events
    WHERE provider_event_id=v_stale_event AND status='failed'
      AND last_error_code='WEBHOOK_PROCESSING_INTERRUPTED') THEN
    RAISE EXCEPTION 'STALE_PADDLE_WEBHOOK_NOT_RECOVERED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key='billing.localized-copy-and-retry') THEN
    RAISE EXCEPTION 'BILLING_LOCALIZATION_CHECK_MISSING';
  END IF;
END $$;
ROLLBACK;
