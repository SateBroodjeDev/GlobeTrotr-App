-- Uitvoeren na 20260908125000_mailbox_sync_diagnostics.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='corporate_mailboxes'
   AND column_name IN ('sync_requested_at','last_sync_attempt_at','last_sync_error_code')) <> 3 THEN
   RAISE EXCEPTION 'MAILBOX_SYNC_DIAGNOSTICS_COLUMNS_MISSING';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
   WHERE item_key='corporate.mail-sync-diagnostics' AND completed_at IS NULL) THEN
   RAISE EXCEPTION 'MAILBOX_SYNC_DIAGNOSTICS_CHECK_MISSING';
 END IF;
END $$;
