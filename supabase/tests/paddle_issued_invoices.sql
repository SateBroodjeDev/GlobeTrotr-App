-- Uitvoeren na 20260908134000_paddle_issued_invoices.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_owner UUID := gen_random_uuid();
  v_workspace UUID := gen_random_uuid();
  v_suffix TEXT := replace(gen_random_uuid()::TEXT, '-', '');
  v_event JSONB;
  v_result TEXT;
  v_expected_end TIMESTAMPTZ;
  v_last_end TIMESTAMPTZ;
  v_index INTEGER;
BEGIN
  INSERT INTO auth.users(id,email,email_confirmed_at)
  VALUES (v_owner, 'stacked-months-' || v_suffix || '@example.invalid', now());
  INSERT INTO public.workspaces(user_id,workspace_uuid,data)
  VALUES (v_owner, v_workspace, '{"plan":"free"}'::JSONB);

  FOR v_index IN 1..6 LOOP
    v_event := jsonb_build_object(
      'event_id', 'evt_' || v_suffix || '_' || v_index,
      'event_type', 'transaction.completed',
      'occurred_at', now(),
      'data', jsonb_build_object(
        'id', 'txn_' || v_suffix || v_index,
        'customer_id', 'ctm_' || v_suffix,
        'status', 'completed',
        'currency_code', 'EUR',
        'globetrotr_plan', 'agency',
        'globetrotr_billing_mode', 'one_time',
        'custom_data', jsonb_build_object('workspace_uuid', v_workspace),
        'details', jsonb_build_object('totals', jsonb_build_object(
          'subtotal', '0', 'tax', '0', 'total', '0', 'credit', '0'
        ))
      )
    );
    SELECT public.process_paddle_billing_event(v_event) INTO v_result;
    IF v_result <> 'processed' OR public.apply_paddle_one_time_purchase(v_event) <> 'applied' THEN
      RAISE EXCEPTION 'STACKED_MONTH_PAYMENT_FAILED: %', v_index;
    END IF;
    IF v_index = 1 THEN
      SELECT ends_at INTO v_expected_end FROM public.billing_entitlements
      WHERE provider_transaction_id = 'txn_' || v_suffix || '1';
    ELSE
      v_expected_end := v_expected_end + interval '1 month';
      IF NOT EXISTS (SELECT 1 FROM public.billing_entitlements
        WHERE provider_transaction_id = 'txn_' || v_suffix || v_index
          AND ends_at = v_expected_end) THEN
        RAISE EXCEPTION 'MONTH_NOT_STACKED: %', v_index;
      END IF;
    END IF;
  END LOOP;

  SELECT max(ends_at) INTO v_last_end FROM public.billing_entitlements
  WHERE workspace_uuid = v_workspace;
  IF (SELECT count(*) FROM public.billing_entitlements WHERE workspace_uuid = v_workspace) <> 6
    OR v_last_end <> v_expected_end
    OR NOT EXISTS (SELECT 1 FROM public.workspaces
      WHERE workspace_uuid = v_workspace AND plan = 'agency') THEN
    RAISE EXCEPTION 'SIX_MONTHS_NOT_STACKED';
  END IF;
  IF public.apply_paddle_one_time_purchase(v_event) <> 'applied'
    OR (SELECT count(*) FROM public.billing_entitlements WHERE workspace_uuid = v_workspace) <> 6
    OR (SELECT max(ends_at) FROM public.billing_entitlements
      WHERE workspace_uuid = v_workspace) <> v_last_end THEN
    RAISE EXCEPTION 'DUPLICATE_PAYMENT_EXTENDED_ACCESS';
  END IF;
  IF EXISTS (SELECT 1 FROM public.corporate_invoices WHERE workspace_uuid = v_workspace) THEN
    RAISE EXCEPTION 'ZERO_VALUE_PADDLE_INVOICE_CREATED';
  END IF;
  IF (SELECT count(*) FROM public.billing_transactions t
    JOIN public.billing_customers c ON c.id = t.customer_id
    WHERE c.workspace_uuid = v_workspace AND t.status = 'completed') <> 6 THEN
    RAISE EXCEPTION 'PAID_TRANSACTIONS_NOT_RECORDED';
  END IF;

  v_event := jsonb_build_object(
    'event_id', 'evt_' || v_suffix || '_numbered',
    'event_type', 'transaction.completed',
    'occurred_at', now(),
    'data', jsonb_build_object(
      'id', 'txn_' || v_suffix || '7',
      'customer_id', 'ctm_' || v_suffix,
      'invoice_number', 'test-' || v_suffix,
      'status', 'completed',
      'currency_code', 'EUR',
      'custom_data', jsonb_build_object('workspace_uuid', v_workspace),
      'details', jsonb_build_object('totals', jsonb_build_object(
        'subtotal', '1000', 'tax', '210', 'total', '1210', 'credit', '0'
      ))
    )
  );
  IF public.process_paddle_billing_event(v_event) <> 'processed'
    OR NOT EXISTS (SELECT 1 FROM public.corporate_invoices
      WHERE external_provider = 'paddle' AND external_id = 'txn_' || v_suffix || '7'
        AND invoice_number = 'test-' || v_suffix AND total_minor = 1210) THEN
    RAISE EXCEPTION 'NUMBERED_PADDLE_INVOICE_MISSING';
  END IF;

  v_event := jsonb_set(v_event, '{event_id}', to_jsonb('evt_' || v_suffix || '_unnumbered'));
  v_event := jsonb_set(v_event, '{data,id}', to_jsonb('txn_' || v_suffix || '8'));
  v_event := v_event #- '{data,invoice_number}';
  IF public.process_paddle_billing_event(v_event) <> 'processed'
    OR EXISTS (SELECT 1 FROM public.corporate_invoices
      WHERE external_provider = 'paddle' AND external_id = 'txn_' || v_suffix || '8') THEN
    RAISE EXCEPTION 'UNNUMBERED_PADDLE_INVOICE_CREATED';
  END IF;
END $$;
ROLLBACK;
