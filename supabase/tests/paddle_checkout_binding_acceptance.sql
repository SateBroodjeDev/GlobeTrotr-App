-- Uitvoeren na 20260908128000_paddle_checkout_binding_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'billing.paddle-checkout-binding' AND completed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'PADDLE_CHECKOUT_BINDING_ACCEPTANCE_MISSING';
  END IF;
END $$;
