BEGIN;

-- A fully discounted transaction has total=0 and credit=0. It is completed,
-- not refunded; only an explicit approved refund or positive credited amount
-- may revoke its one-time entitlement.
CREATE OR REPLACE FUNCTION private.normalize_zero_discount_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.total_minor = 0 AND NEW.refunded_minor = 0 AND NEW.status = 'refunded'
    AND NOT EXISTS (SELECT 1 FROM public.billing_webhook_events b
      WHERE b.provider = 'paddle' AND b.status IN ('processing','processed')
        AND b.event_type LIKE 'adjustment.%'
        AND b.payload->'data'->>'transaction_id' = NEW.provider_transaction_id
        AND b.payload->'data'->>'action' = 'refund'
        AND b.payload->'data'->>'status' = 'approved') THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.normalize_zero_discount_transaction() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS normalize_zero_discount_transaction ON public.billing_transactions;
CREATE TRIGGER normalize_zero_discount_transaction
BEFORE INSERT OR UPDATE ON public.billing_transactions
FOR EACH ROW EXECUTE FUNCTION private.normalize_zero_discount_transaction();

CREATE OR REPLACE FUNCTION public.reconcile_paddle_one_time_purchase(p_event JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE d JSONB := p_event->'data'; tx TEXT; v_total BIGINT; v_credit BIGINT;
BEGIN
  tx := CASE WHEN p_event->>'event_type' LIKE 'adjustment.%'
    THEN d->>'transaction_id' ELSE d->>'id' END;
  IF tx IS NULL THEN RETURN 'ignored'; END IF;
  IF p_event->>'event_type' LIKE 'adjustment.%'
     AND d->>'action' = 'refund' AND d->>'status' = 'approved' THEN
    UPDATE public.billing_entitlements SET ends_at = LEAST(ends_at, now())
      WHERE provider_transaction_id = tx;
    PERFORM public.expire_billing_entitlements();
    RETURN 'revoked';
  END IF;
  IF p_event->>'event_type' LIKE 'transaction.%' THEN
    v_total := COALESCE((d->'details'->'totals'->>'total')::BIGINT, 0);
    v_credit := COALESCE((d->'details'->'totals'->>'credit')::BIGINT, 0);
    IF v_total > 0 AND v_credit >= v_total THEN
      UPDATE public.billing_entitlements SET ends_at = LEAST(ends_at, now())
        WHERE provider_transaction_id = tx;
      PERFORM public.expire_billing_entitlements();
      RETURN 'revoked';
    END IF;
  END IF;
  RETURN 'unchanged';
END $$;
REVOKE ALL ON FUNCTION public.reconcile_paddle_one_time_purchase(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_paddle_one_time_purchase(JSONB) TO service_role;

-- Restore only an existing, previously verified and processed one-time purchase.
-- An ignored webhook without a trusted workspace binding never grants access.
UPDATE public.billing_transactions t SET status = 'completed', updated_at = now()
WHERE t.status = 'refunded' AND t.total_minor = 0 AND t.refunded_minor = 0
  AND EXISTS (SELECT 1 FROM public.billing_entitlements e
    WHERE e.provider_transaction_id = t.provider_transaction_id)
  AND NOT EXISTS (SELECT 1 FROM public.billing_webhook_events b
    WHERE b.provider = 'paddle' AND b.status = 'processed'
      AND b.event_type LIKE 'adjustment.%'
      AND b.payload->'data'->>'transaction_id' = t.provider_transaction_id
      AND b.payload->'data'->>'action' = 'refund'
      AND b.payload->'data'->>'status' = 'approved');

UPDATE public.billing_entitlements e
SET ends_at = e.starts_at + interval '1 month'
WHERE e.ends_at < e.starts_at + interval '1 month'
  AND e.starts_at + interval '1 month' > now()
  AND EXISTS (SELECT 1 FROM public.billing_transactions t
    WHERE t.provider_transaction_id = e.provider_transaction_id
      AND t.status = 'completed' AND t.total_minor = 0 AND t.refunded_minor = 0)
  AND EXISTS (SELECT 1 FROM public.billing_webhook_events b
    WHERE b.provider = 'paddle' AND b.status = 'processed'
      AND b.event_type = 'transaction.completed'
      AND b.payload->'data'->>'id' = e.provider_transaction_id
      AND b.payload->'data'->>'globetrotr_billing_mode' = 'one_time'
      AND b.payload->'data'->'custom_data'->>'workspace_uuid' = e.workspace_uuid::TEXT)
  AND NOT EXISTS (SELECT 1 FROM public.billing_webhook_events b
    WHERE b.provider = 'paddle' AND b.status = 'processed'
      AND b.event_type LIKE 'adjustment.%'
      AND b.payload->'data'->>'transaction_id' = e.provider_transaction_id
      AND b.payload->'data'->>'action' = 'refund'
      AND b.payload->'data'->>'status' = 'approved');

UPDATE public.workspaces w SET
  plan = CASE WHEN EXISTS (SELECT 1 FROM public.billing_entitlements e
    WHERE e.workspace_uuid = w.workspace_uuid AND e.plan = 'agency' AND e.ends_at > now())
    THEN 'agency' ELSE 'pro' END,
  data = jsonb_set(COALESCE(w.data, '{}'::JSONB), '{plan}',
    to_jsonb(CASE WHEN EXISTS (SELECT 1 FROM public.billing_entitlements e
      WHERE e.workspace_uuid = w.workspace_uuid AND e.plan = 'agency' AND e.ends_at > now())
      THEN 'agency' ELSE 'pro' END), true),
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM public.billing_entitlements e
  WHERE e.workspace_uuid = w.workspace_uuid AND e.ends_at > now())
  AND w.plan = 'free';

-- Old one-time deliveries ignored before a trusted workspace was available can
-- be retried after configuration is corrected. No access is granted here.
UPDATE public.billing_webhook_events
SET status = 'failed', attempts = 0, processed_at = NULL
WHERE provider = 'paddle' AND status = 'ignored'
  AND last_error_code = 'WORKSPACE_NOT_FOUND'
  AND event_type = 'transaction.completed'
  AND payload->'data'->'custom_data'->>'checkout_binding' IS NOT NULL;

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES ('billing.zero-discount','Betaling','100%-korting: €0-transactie blijft voltooid, activeert één maand en wordt niet als terugbetaling verwerkt','100% discount: €0 transaction remains completed, grants one month and is not treated as a refund',230)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
