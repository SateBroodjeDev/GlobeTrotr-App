-- Uitvoeren na 20260908046000_agency_quote_responses.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE qr AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() client_id,gen_random_uuid() quote_id,gen_random_uuid() variant_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'quote-response@example.invalid',now()FROM qr;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::jsonb FROM qr;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale)SELECT client_id,workspace_id,'Klant','active','nl'FROM qr;
INSERT INTO public.agency_quotes(id,workspace_uuid,client_id,title,status,currency,share_token_hash,shared_at,share_expires_at)SELECT quote_id,workspace_id,client_id,'Keuzereis','ready','EUR',repeat('c',64),now(),now()+interval '7 days' FROM qr;
INSERT INTO public.agency_quote_variants(id,quote_id,name,amount,position)SELECT variant_id,quote_id,'Comfort',1250,0 FROM qr;
DO $$ DECLARE v_result JSONB;BEGIN
 SELECT public.respond_agency_quote(repeat('c',64),'accept',(SELECT variant_id FROM qr),NULL) INTO v_result;
 IF v_result->>'status'<>'accepted' OR NOT EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=(SELECT quote_id FROM qr) AND status='accepted' AND accepted_variant_id=(SELECT variant_id FROM qr)) THEN RAISE EXCEPTION 'Acceptatie mislukt';END IF;
 SELECT public.respond_agency_quote(repeat('c',64),'reject',NULL,NULL) INTO v_result;
 IF v_result->>'status'<>'accepted' THEN RAISE EXCEPTION 'Tweede antwoord wijzigde de uitkomst';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT owner_id FROM qr) AND kind='agency_quote') THEN RAISE EXCEPTION 'Teammelding ontbreekt';END IF;
END $$;ROLLBACK;
