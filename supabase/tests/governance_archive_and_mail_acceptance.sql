-- Uitvoeren na 20260908142000_governance_archive_and_mail_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='privacy_requests' AND column_name='archived_at') THEN
    RAISE EXCEPTION 'PRIVACY_ARCHIVE_COLUMN_MISSING';
  END IF;
  IF (SELECT count(*) FROM public.release_checklist_items
    WHERE item_key IN ('corporate.mail-html','corporate.governance')) <> 2 THEN
    RAISE EXCEPTION 'GOVERNANCE_MAIL_ACCEPTANCE_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key='corporate.mail-html'
      AND label_nl LIKE '%afbeeldingen%'
      AND label_en LIKE '%explicit choice%'
      AND label_en LIKE '%scanned attached images%') THEN
    RAISE EXCEPTION 'COMPANY_MAIL_IMAGE_VIEWING_ACCEPTANCE_MISSING';
  END IF;
  IF has_table_privilege('authenticated','public.privacy_requests','UPDATE') THEN
    RAISE EXCEPTION 'PRIVACY_ARCHIVE_TABLE_EXPOSED';
  END IF;
END;
$$;
