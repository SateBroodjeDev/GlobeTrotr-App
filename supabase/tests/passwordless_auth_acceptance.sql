-- Uitvoeren na 20260908104000_passwordless_auth_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('auth.password-recovery-entry','auth.magic-link-entry'))<>2 THEN
   RAISE EXCEPTION 'PASSWORDLESS_AUTH_ACCEPTANCE_MISSING';
 END IF;
END $$;
