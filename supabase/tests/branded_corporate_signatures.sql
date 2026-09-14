-- Uitvoeren na 20260908113000_branded_corporate_signatures.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.mail-branding') THEN RAISE EXCEPTION 'CORPORATE_MAIL_BRANDING_ACCEPTANCE_MISSING'; END IF;
 IF EXISTS(SELECT 1 FROM public.corporate_mailboxes WHERE signature_text IS NULL) THEN RAISE EXCEPTION 'CORPORATE_MAIL_SIGNATURE_INCOMPLETE'; END IF;
END $$;
