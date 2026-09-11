-- Uitvoeren na 20260908047000_convert_agency_quotes.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE qc AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() client_id,gen_random_uuid() quote_id,gen_random_uuid() variant_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'quote-convert@example.invalid',now()FROM qc;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::jsonb FROM qc;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale)SELECT client_id,workspace_id,'Conversieklant','active','nl'FROM qc;
INSERT INTO public.agency_quotes(id,workspace_uuid,client_id,title,status,currency)SELECT quote_id,workspace_id,client_id,'Geaccepteerde reis','accepted','EUR' FROM qc;
INSERT INTO public.agency_quote_variants(id,quote_id,name,amount,position)SELECT variant_id,quote_id,'Comfort',1450,0 FROM qc;
UPDATE public.agency_quotes SET accepted_variant_id=(SELECT variant_id FROM qc) WHERE id=(SELECT quote_id FROM qc);
DO $$ DECLARE v_trip UUID;v_again UUID;BEGIN
 SELECT public.convert_agency_quote((SELECT workspace_id FROM qc),(SELECT quote_id FROM qc),(SELECT owner_id FROM qc),jsonb_build_object('name','Nieuwe klantreis','start',current_date+30,'end',current_date+37,'template','citytrip')) INTO v_trip;
 SELECT public.convert_agency_quote((SELECT workspace_id FROM qc),(SELECT quote_id FROM qc),(SELECT owner_id FROM qc),'{}'::jsonb) INTO v_again;
 IF v_trip<>v_again OR NOT EXISTS(SELECT 1 FROM public.trips WHERE trip_uuid=v_trip AND budget=1450 AND is_public=false) THEN RAISE EXCEPTION 'Offerteconversie is niet correct of idempotent';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.agency_client_trips WHERE client_id=(SELECT client_id FROM qc) AND trip_uuid=v_trip) THEN RAISE EXCEPTION 'Klantkoppeling ontbreekt';END IF;
END $$;ROLLBACK;
