-- Uitvoeren na 20260908044000_agency_quote_management.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE quote_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() client_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'quote-owner@example.invalid',now()FROM quote_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM quote_ids;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale)SELECT client_id,workspace_id,'Offerteklant','active','nl'FROM quote_ids;
DO $$ DECLARE v_id UUID;v_owner UUID;v_workspace UUID;v_client UUID;BEGIN SELECT owner_id,workspace_id,client_id INTO v_owner,v_workspace,v_client FROM quote_ids;
 SELECT public.save_agency_quote(v_workspace,NULL,jsonb_build_object('clientId',v_client,'tripId','','title','Zomerreis','introduction','Kies een variant','currency','EUR','status','draft','validUntil',current_date+14),jsonb_build_array(jsonb_build_object('name','Comfort','description','Met transfers','amount',1250),jsonb_build_object('name','Premium','description','Extra bagage','amount',1750)),v_owner)INTO v_id;
 IF(SELECT count(*)FROM public.agency_quote_variants WHERE quote_id=v_id)<>2 THEN RAISE EXCEPTION 'Offertevarianten ontbreken';END IF;
 PERFORM public.save_agency_quote(v_workspace,v_id,jsonb_build_object('clientId',v_client,'tripId','','title','Zomerreis gewijzigd','introduction','','currency','EUR','status','ready','validUntil',current_date+21),jsonb_build_array(jsonb_build_object('name','Definitief','description','','amount',1500)),v_owner);
 IF NOT EXISTS(SELECT 1 FROM public.agency_quotes WHERE id=v_id AND status='ready' AND title='Zomerreis gewijzigd')OR(SELECT count(*)FROM public.agency_quote_variants WHERE quote_id=v_id)<>1 THEN RAISE EXCEPTION 'Atomaire offertewijziging mislukt';END IF;
END $$;ROLLBACK;
