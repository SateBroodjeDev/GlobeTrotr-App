-- Uitvoeren na 20260908138000_corporate_mail_retry_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'corporate_mail_send_queue'
      AND column_name IN (
        'body_html', 'status', 'attempts', 'available_at', 'last_error_code', 'updated_at'
      )
  ) <> 6 THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_RETRY_QUEUE_INCOMPLETE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'corporate.mail-retry'
  ) THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_RETRY_ACCEPTANCE_MISSING';
  END IF;

  IF has_table_privilege('authenticated', 'public.corporate_mail_send_queue', 'UPDATE') THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_RETRY_QUEUE_EXPOSED';
  END IF;
END;
$$;
