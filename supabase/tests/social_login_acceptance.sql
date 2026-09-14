-- Uitvoeren na 20260908103000_social_login_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('auth.oauth-google','auth.oauth-facebook','auth.oauth-discord','auth.oauth-redirect','auth.oauth-identity-linking'))<>5 THEN
   RAISE EXCEPTION 'SOCIAL_LOGIN_ACCEPTANCE_MISSING';
 END IF;
END $$;
