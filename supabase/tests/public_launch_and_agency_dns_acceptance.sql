-- Uitvoeren na 20260908145000_public_launch_and_agency_dns_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
  IF (SELECT count(*) FROM public.release_checklist_items
      WHERE item_key IN ('public.launch-pages', 'agency.domain-dns-https')) <> 2 THEN
    RAISE EXCEPTION 'PUBLIC_LAUNCH_ACCEPTANCE_MISSING';
  END IF;
END $$;
