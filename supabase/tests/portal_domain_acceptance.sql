-- Uitvoeren na 20260908146000_portal_domain_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
  IF (SELECT count(*) FROM public.release_checklist_items
      WHERE item_key IN ('public.portal-hosts', 'auth.portal-cutover', 'agency.domain-tenant-binding')) <> 3 THEN
    RAISE EXCEPTION 'PORTAL_DOMAIN_ACCEPTANCE_MISSING';
  END IF;
END $$;
