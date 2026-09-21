-- Uitvoeren na 20260908120000_corporate_mail_threads.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public'
    AND indexname='corporate_mail_messages_thread_idx') THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_THREAD_INDEX_MISSING';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items
    WHERE item_key='corporate.mail-threads') THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_THREAD_CHECK_MISSING';
  END IF;
END $$;
