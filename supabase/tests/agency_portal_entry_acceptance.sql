-- Uitvoeren na 20260908147000_agency_portal_entry_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.agency_domains'::regclass AND conname='agency_domains_reserved_subdomain') THEN
    RAISE EXCEPTION 'AGENCY_RESERVED_HOST_CHECK_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.portal-entry') THEN
    RAISE EXCEPTION 'AGENCY_PORTAL_ENTRY_ACCEPTANCE_MISSING';
  END IF;
END $$;
