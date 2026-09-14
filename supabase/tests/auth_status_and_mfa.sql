-- Uitvoeren na 20260908109000_auth_status_and_mfa.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT has_function_privilege('authenticated','public.get_public_platform_status()','EXECUTE') THEN
   RAISE EXCEPTION 'AUTHENTICATED_PUBLIC_STATUS_MISSING';
 END IF;
 IF EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='auth.oauth-facebook') THEN
   RAISE EXCEPTION 'FACEBOOK_ACCEPTANCE_STILL_PRESENT';
 END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('auth.totp-mfa','public.status-authenticated'))<>2 THEN
   RAISE EXCEPTION 'AUTH_STATUS_ACCEPTANCE_MISSING';
 END IF;
END $$;
