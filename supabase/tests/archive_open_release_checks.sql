-- Uitvoeren na 20260908179000_archive_open_release_checks.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='release_checklist_items'
   AND column_name IN('archived_at','archive_reason'))<>2 THEN
   RAISE EXCEPTION 'RELEASE_CHECK_ARCHIVE_COLUMNS_MISSING';
 END IF;
 IF EXISTS(SELECT 1 FROM public.release_checklist_items
   WHERE completed_at IS NULL AND archived_at IS NULL) THEN
   RAISE EXCEPTION 'OPEN_RELEASE_CHECKS_NOT_ARCHIVED';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public'
   AND indexname='release_checklist_active_position_idx') THEN
   RAISE EXCEPTION 'ACTIVE_RELEASE_CHECK_INDEX_MISSING';
 END IF;
END $$;
