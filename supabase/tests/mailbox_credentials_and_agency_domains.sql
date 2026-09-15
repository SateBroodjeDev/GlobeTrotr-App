-- Uitvoeren na 20260908115000_mailbox_credentials_and_agency_domains.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='corporate_mailboxes' AND column_name IN('imap_host','imap_username','imap_password_ciphertext'))<>3 THEN RAISE EXCEPTION 'MAILBOX_CREDENTIAL_COLUMNS_MISSING'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('corporate.mailbox-credentials','corporate.mail-html','agency.domain-onboarding'))<>3 THEN RAISE EXCEPTION 'MAIL_DOMAIN_ACCEPTANCE_MISSING'; END IF;
END $$;
