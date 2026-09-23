-- Uitvoeren na 20260908159000_agency_content_library.sql. Alleen-lezen.
DO $$ BEGIN
 IF(SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN('agency_content_library','agency_content_library_versions'))<>2 THEN RAISE EXCEPTION 'AGENCY_CONTENT_LIBRARY_TABLES_MISSING';END IF;
 IF(SELECT count(*) FROM pg_trigger WHERE tgrelid='public.agency_content_library'::regclass AND tgname IN('validate_agency_content_library','version_agency_content_library') AND NOT tgisinternal)<>2 THEN RAISE EXCEPTION 'AGENCY_CONTENT_LIBRARY_TRIGGERS_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.content-library')THEN RAISE EXCEPTION 'AGENCY_CONTENT_LIBRARY_ACCEPTANCE_MISSING';END IF;
END $$;
