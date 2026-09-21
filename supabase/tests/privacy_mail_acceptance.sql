-- Uitvoeren na 20260908124000_privacy_mail_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key='privacy.mail-processing'
   AND completed_at IS NULL) THEN
   RAISE EXCEPTION 'PRIVACY_MAIL_ACCEPTANCE_MISSING_OR_PREMATURELY_COMPLETE';
 END IF;
END $$;
