-- Uitvoeren na 20260908045000_secure_agency_quote_sharing.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE quote_share_ids AS SELECT gen_random_uuid() owner_id, gen_random_uuid() workspace_id, gen_random_uuid() client_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'quote-share@example.invalid',now() FROM quote_share_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM quote_share_ids;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale) SELECT client_id,workspace_id,'Deelklant','active','nl' FROM quote_share_ids;
DO $$
DECLARE v_owner UUID;v_workspace UUID;v_client UUID;v_quote UUID;v_hash TEXT:=repeat('a',64);v_expiry TIMESTAMPTZ:=now()+interval '7 days';
BEGIN
 SELECT owner_id,workspace_id,client_id INTO v_owner,v_workspace,v_client FROM quote_share_ids;
 INSERT INTO public.agency_quotes(workspace_uuid,client_id,title,status,currency,created_by,updated_by)
 VALUES(v_workspace,v_client,'Veilige offerte','ready','EUR',v_owner,v_owner) RETURNING id INTO v_quote;
 INSERT INTO public.agency_quote_variants(quote_id,name,amount,position) VALUES(v_quote,'Comfort',1250,0);
 PERFORM public.prepare_agency_quote_share(v_workspace,v_quote,v_hash,v_expiry,v_owner);
 IF NOT EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=v_quote AND share_token_hash=v_hash AND shared_at IS NOT NULL AND share_expires_at=v_expiry) THEN
  RAISE EXCEPTION 'Veilige deellink werd niet opgeslagen';
 END IF;
 UPDATE public.agency_quotes SET status='draft' WHERE id=v_quote;
 BEGIN
  PERFORM public.prepare_agency_quote_share(v_workspace,v_quote,repeat('b',64),v_expiry,v_owner);
  RAISE EXCEPTION 'Een conceptofferte werd ten onrechte gedeeld';
 EXCEPTION WHEN no_data_found THEN NULL;
 END;
END $$;
ROLLBACK;
