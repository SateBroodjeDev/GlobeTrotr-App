-- Uitvoeren na 20260908132000_zero_discount_billing_repair.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE v_result TEXT;
BEGIN
  SELECT public.reconcile_paddle_one_time_purchase(jsonb_build_object(
    'event_type','transaction.completed',
    'data',jsonb_build_object('id','txn_zero_discount_test',
      'details',jsonb_build_object('totals',jsonb_build_object('total','0','credit','0')))
  )) INTO v_result;
  IF v_result <> 'unchanged' THEN RAISE EXCEPTION 'ZERO_DISCOUNT_MISCLASSIFIED: %', v_result; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.billing_transactions'::regclass
    AND tgname='normalize_zero_discount_transaction' AND NOT tgisinternal)
    THEN RAISE EXCEPTION 'ZERO_DISCOUNT_TRIGGER_MISSING'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key='billing.zero-discount')
    THEN RAISE EXCEPTION 'ZERO_DISCOUNT_CHECK_MISSING'; END IF;
END $$;
ROLLBACK;
