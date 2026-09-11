-- Uitvoeren na 20260908048000_manage_agency_quote_shares.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE qsm AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() client_id,gen_random_uuid() quote_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'quote-share-management@example.invalid',now()FROM qsm;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM qsm;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale)SELECT client_id,workspace_id,'Deelklant','active','nl'FROM qsm;
INSERT INTO public.agency_quotes(id,workspace_uuid,client_id,title,status,currency)SELECT quote_id,workspace_id,client_id,'Linkbeheer','ready','EUR'FROM qsm;
DO $$ DECLARE v_first TEXT:=repeat('a',64);v_second TEXT:=repeat('b',64);BEGIN
 PERFORM public.prepare_agency_quote_share((SELECT workspace_id FROM qsm),(SELECT quote_id FROM qsm),v_first,now()+interval '7 days',(SELECT owner_id FROM qsm));
 PERFORM public.prepare_agency_quote_share((SELECT workspace_id FROM qsm),(SELECT quote_id FROM qsm),v_second,now()+interval '7 days',(SELECT owner_id FROM qsm));
 IF EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=(SELECT quote_id FROM qsm) AND share_token_hash=v_first) OR NOT EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=(SELECT quote_id FROM qsm) AND share_token_hash=v_second) THEN RAISE EXCEPTION 'Roteren maakte de oude link niet ongeldig';END IF;
 IF NOT public.revoke_agency_quote_share((SELECT workspace_id FROM qsm),(SELECT quote_id FROM qsm),(SELECT owner_id FROM qsm)) THEN RAISE EXCEPTION 'Actieve link werd niet ingetrokken';END IF;
 IF EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=(SELECT quote_id FROM qsm) AND (share_token_hash IS NOT NULL OR shared_at IS NOT NULL OR share_expires_at IS NOT NULL)) THEN RAISE EXCEPTION 'Ingetrokken linkgegevens bleven actief';END IF;
 IF public.revoke_agency_quote_share((SELECT workspace_id FROM qsm),(SELECT quote_id FROM qsm),(SELECT owner_id FROM qsm)) THEN RAISE EXCEPTION 'Tweede intrekking was niet herhaalveilig';END IF;
END $$;
ROLLBACK;
