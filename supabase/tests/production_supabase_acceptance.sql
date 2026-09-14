-- Uitvoeren na 20260908099000_production_supabase_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('production.supabase-project','production.database-migrations','production.auth-storage','production.bootstrap-admin','production.staging-fallback'))<>5 THEN
   RAISE EXCEPTION 'PRODUCTION_SUPABASE_ACCEPTANCE_MISSING';
 END IF;
END $$;
