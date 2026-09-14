-- Uitvoeren na 20260908108000_production_privacy_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.release_checklist_items
    WHERE item_key = 'public.production-privacy'
  ) THEN
    RAISE EXCEPTION 'PRODUCTION_PRIVACY_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
