-- Uitvoeren na 20260908112000_corporate_imap_mail.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='corporate_mail_messages' AND column_name='body_text') THEN RAISE EXCEPTION 'CORPORATE_MAIL_BODY_MISSING'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('corporate.mail-imap','corporate.staff-mailbox'))<>2 THEN RAISE EXCEPTION 'CORPORATE_IMAP_ACCEPTANCE_MISSING'; END IF;
END $$;
