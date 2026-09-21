-- Uitvoeren na 20260908122000_corporate_mail_upload_cleanup.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='corporate_mail_uploads') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_UPLOAD_RESERVATIONS_MISSING';
 END IF;
 IF has_table_privilege('authenticated','public.corporate_mail_uploads','SELECT')
    OR has_table_privilege('anon','public.corporate_mail_uploads','SELECT') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_UPLOAD_RESERVATIONS_EXPOSED';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='corporate_mail_uploads' AND indexname='corporate_mail_uploads_expiry_idx') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_UPLOAD_EXPIRY_INDEX_MISSING';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.mail-upload-cleanup') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_UPLOAD_CLEANUP_ACCEPTANCE_MISSING';
 END IF;
END $$;
