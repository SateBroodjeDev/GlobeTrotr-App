-- Uitvoeren na 20260908175000_agency_smtp_delivery.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='agency_mail_settings' AND column_name IN('smtp_host','smtp_port','smtp_secure','smtp_username','smtp_password_ciphertext','smtp_tested_at','smtp_test_status','smtp_last_error_code'))<>8 THEN RAISE EXCEPTION 'AGENCY_SMTP_COLUMNS_MISSING';END IF;
 IF has_table_privilege('authenticated','public.agency_mail_settings','SELECT') THEN RAISE EXCEPTION 'AGENCY_SMTP_SECRETS_EXPOSED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.smtp-delivery') THEN RAISE EXCEPTION 'AGENCY_SMTP_ACCEPTANCE_MISSING';END IF;
END $$;
