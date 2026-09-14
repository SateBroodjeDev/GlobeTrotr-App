-- Uitvoeren na 20260908102000_email_template_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('mail.auth-confirmation','mail.auth-recovery','mail.auth-email-change','mail.auth-magic-link','mail.visual-consistency'))<>5 THEN
   RAISE EXCEPTION 'EMAIL_TEMPLATE_ACCEPTANCE_MISSING';
 END IF;
END $$;
