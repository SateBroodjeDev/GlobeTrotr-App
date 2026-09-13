-- Uitvoeren na 20260908081000_secure_agency_quote_variant_reads.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE aqvi AS SELECT gen_random_uuid() owner_a,gen_random_uuid() owner_b,gen_random_uuid() workspace_a,gen_random_uuid() workspace_b,gen_random_uuid() client_a;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_a,'quote-a@example.invalid',now() FROM aqvi UNION ALL SELECT owner_b,'quote-b@example.invalid',now() FROM aqvi;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_a,workspace_a,'agency','{}'::jsonb FROM aqvi UNION ALL SELECT owner_b,workspace_b,'agency','{}'::jsonb FROM aqvi;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,email) SELECT client_a,workspace_a,'Klant A','client-a@example.invalid' FROM aqvi;
WITH inserted AS(INSERT INTO public.agency_quotes(workspace_uuid,client_id,title,created_by) SELECT workspace_a,client_a,'Geheime offerte',owner_a FROM aqvi RETURNING id)
INSERT INTO public.agency_quote_variants(quote_id,name,description,amount,position) SELECT id,'Privéprijs','Niet zichtbaar buiten Agency A',1234.56,0 FROM inserted;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT owner_b::text FROM aqvi),true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.agency_quote_variants) THEN RAISE EXCEPTION 'CROSS_WORKSPACE_QUOTE_VARIANT_LEAK';END IF;END $$;
RESET ROLE;
ROLLBACK;
