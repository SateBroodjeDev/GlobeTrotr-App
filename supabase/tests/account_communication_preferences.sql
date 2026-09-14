-- Uitvoeren na 20260908100000_account_communication_preferences.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('auth.production-email','auth.passkeys','account.communication','public.trip-layout','deployment.brand-assets'))<>5 THEN
   RAISE EXCEPTION 'ACCOUNT_COMMUNICATION_ACCEPTANCE_MISSING';
 END IF;
END $$;
