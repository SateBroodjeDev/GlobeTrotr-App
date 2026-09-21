-- Uitvoeren na 20260908133000_paddle_discounted_totals.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_owner UUID := gen_random_uuid();
  v_workspace UUID := gen_random_uuid();
  v_suffix TEXT := replace(gen_random_uuid()::TEXT, '-', '');
  v_tx TEXT;
  v_event JSONB;
  v_result TEXT;
BEGIN
  v_tx := 'txn_' || v_suffix;
  INSERT INTO auth.users(id,email,email_confirmed_at)
  VALUES (v_owner, 'paddle-discount-' || v_suffix || '@example.invalid', now());
  INSERT INTO public.workspaces(user_id,workspace_uuid,data)
  VALUES (v_owner, v_workspace, '{"plan":"free"}'::JSONB);

  v_event := jsonb_build_object(
    'event_id', 'evt_' || v_suffix,
    'event_type', 'transaction.completed',
    'occurred_at', now(),
    'data', jsonb_build_object(
      'id', v_tx,
      'customer_id', 'ctm_' || v_suffix,
      'invoice_number', 'discount-' || v_suffix,
      'status', 'completed',
      'currency_code', 'EUR',
      'globetrotr_plan', 'agency',
      'globetrotr_billing_mode', 'one_time',
      'custom_data', jsonb_build_object('workspace_uuid', v_workspace),
      'details', jsonb_build_object('totals', jsonb_build_object(
        'subtotal', '2397', 'discount', '2397', 'tax', '0', 'total', '0', 'credit', '0'
      ))
    )
  );
  SELECT public.process_paddle_billing_event(v_event) INTO v_result;
  IF v_result <> 'processed' THEN
    RAISE EXCEPTION 'DISCOUNTED_PADDLE_EVENT_FAILED: %',
      (SELECT last_error_code FROM public.billing_webhook_events WHERE provider_event_id = v_event->>'event_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.billing_transactions
    WHERE provider_transaction_id = v_tx AND status = 'completed'
      AND subtotal_minor = 0 AND total_minor = 0 AND refunded_minor = 0) THEN
    RAISE EXCEPTION 'DISCOUNTED_PADDLE_TRANSACTION_INVALID';
  END IF;
  -- Later migration 1340 intentionally stops creating a Paddle invoice for €0.
  -- If an older local mirror exists, it must still satisfy the net-total check.
  IF EXISTS (SELECT 1 FROM public.corporate_invoices
    WHERE external_provider = 'paddle' AND external_id = v_tx
      AND (subtotal_minor <> 0 OR total_minor <> 0 OR status <> 'paid')) THEN
    RAISE EXCEPTION 'DISCOUNTED_PADDLE_INVOICE_TOTAL_INVALID';
  END IF;
  IF public.apply_paddle_one_time_purchase(v_event) <> 'applied'
    OR NOT EXISTS (SELECT 1 FROM public.workspaces
      WHERE workspace_uuid = v_workspace AND plan = 'agency') THEN
    RAISE EXCEPTION 'DISCOUNTED_PADDLE_ENTITLEMENT_INVALID';
  END IF;
END $$;
ROLLBACK;
