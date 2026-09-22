-- Uitvoeren na 20260908148000_cross_domain_navigation_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key='public.cross-domain-navigation') THEN
    RAISE EXCEPTION 'CROSS_DOMAIN_NAVIGATION_ACCEPTANCE_MISSING';
  END IF;
END $$;
