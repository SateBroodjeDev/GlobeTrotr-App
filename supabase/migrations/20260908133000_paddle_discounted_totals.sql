BEGIN;

-- Paddle's details.totals.subtotal is before discounts. Our billing tables
-- store the net subtotal and require total = subtotal + tax. Normalize only
-- Paddle rows; retain the unmodified Paddle amounts in the webhook payload.
CREATE OR REPLACE FUNCTION private.normalize_paddle_discounted_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.total_minor < NEW.subtotal_minor + NEW.tax_minor
    AND NEW.tax_minor <= NEW.total_minor THEN
    IF TG_TABLE_NAME = 'billing_transactions' THEN
      IF (to_jsonb(NEW)->>'provider_transaction_id') ~ '^txn_[a-z0-9]+$'
        AND EXISTS (
          SELECT 1 FROM public.billing_customers c
          WHERE c.id = (to_jsonb(NEW)->>'customer_id')::UUID AND c.provider = 'paddle'
        ) THEN
        NEW.subtotal_minor := NEW.total_minor - NEW.tax_minor;
      END IF;
    ELSIF TG_TABLE_NAME = 'corporate_invoices' THEN
      IF to_jsonb(NEW)->>'external_provider' = 'paddle' THEN
        NEW.subtotal_minor := NEW.total_minor - NEW.tax_minor;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.normalize_paddle_discounted_totals() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS normalize_paddle_discounted_totals ON public.billing_transactions;
CREATE TRIGGER normalize_paddle_discounted_totals
BEFORE INSERT OR UPDATE ON public.billing_transactions
FOR EACH ROW EXECUTE FUNCTION private.normalize_paddle_discounted_totals();

DROP TRIGGER IF EXISTS normalize_paddle_discounted_totals ON public.corporate_invoices;
CREATE TRIGGER normalize_paddle_discounted_totals
BEFORE INSERT OR UPDATE ON public.corporate_invoices
FOR EACH ROW EXECUTE FUNCTION private.normalize_paddle_discounted_totals();

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES (
  'billing.discounted-totals', 'Betaling',
  'Paddle-betaling met 100% korting verwerken: transactie, factuur en Agency-toegang controleren',
  'Verify a 100% discounted Paddle payment creates a transaction, invoice and Agency access',
  233
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
