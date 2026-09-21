BEGIN;

-- Repair production databases that applied an earlier version of 1330: the
-- shared trigger must never dereference a field absent from either table.
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

-- Paddle does not offer invoice PDFs for zero-value transactions. A local
-- transaction is still recorded, but an internal invoice must only mirror an
-- actual, numbered Paddle invoice for a positive completed payment.
CREATE OR REPLACE FUNCTION private.skip_unissued_paddle_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.external_provider = 'paddle'
    AND (NEW.total_minor = 0 OR NEW.invoice_number = NEW.external_id) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.skip_unissued_paddle_invoice() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS skip_unissued_paddle_invoice ON public.corporate_invoices;
CREATE TRIGGER skip_unissued_paddle_invoice
BEFORE INSERT ON public.corporate_invoices
FOR EACH ROW EXECUTE FUNCTION private.skip_unissued_paddle_invoice();

-- Preserve the authoritative transaction and webhook history. Remove only
-- local Paddle invoice mirrors that could never have a provider PDF.
DELETE FROM public.corporate_invoices
WHERE external_provider = 'paddle'
  AND status = 'paid'
  AND (total_minor = 0 OR invoice_number = external_id);

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES (
  'billing.issued-invoices-and-stacked-months', 'Betaling',
  'Abonnementswijziging toont alleen een echte Paddle-factuur; zes losse maandbetalingen geven zes maanden toegang',
  'Plan changes show only issued Paddle invoices; six standalone monthly payments grant six months of access',
  234
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
