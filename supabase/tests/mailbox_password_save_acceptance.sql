-- Uitvoeren na 20260908139000_mailbox_password_save_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'corporate.mailbox-credentials'
      AND label_nl LIKE '%sterretjes%'
      AND label_en LIKE '%masked%'
  ) THEN
    RAISE EXCEPTION 'MAILBOX_PASSWORD_SAVE_ACCEPTANCE_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'corporate_mailboxes'
      AND column_name = 'credentials_updated_at'
  ) THEN
    RAISE EXCEPTION 'MAILBOX_PASSWORD_STATUS_COLUMN_MISSING';
  END IF;
END;
$$;
