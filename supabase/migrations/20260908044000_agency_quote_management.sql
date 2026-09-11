-- Atomaire interne opslag voor Agency-offertes en hun varianten.
-- Uitvoeren na 20260908043000_agency_quotes.sql.
BEGIN;
CREATE OR REPLACE FUNCTION public.save_agency_quote(p_workspace_uuid UUID,p_quote_id UUID,p_payload JSONB,p_variants JSONB,p_actor_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id UUID:=COALESCE(p_quote_id,gen_random_uuid());v_variant JSONB;v_position INTEGER:=0;
BEGIN
 IF jsonb_typeof(p_payload)<>'object' OR jsonb_typeof(p_variants)<>'array' OR jsonb_array_length(p_variants)<1 OR jsonb_array_length(p_variants)>10 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_QUOTE';END IF;
 IF p_quote_id IS NULL THEN
  INSERT INTO public.agency_quotes(id,workspace_uuid,client_id,trip_uuid,title,introduction,currency,status,valid_until,created_by,updated_by)
  VALUES(v_id,p_workspace_uuid,(p_payload->>'clientId')::UUID,NULLIF(p_payload->>'tripId','')::UUID,btrim(p_payload->>'title'),NULLIF(btrim(p_payload->>'introduction'),''),p_payload->>'currency',p_payload->>'status',NULLIF(p_payload->>'validUntil','')::DATE,p_actor_id,p_actor_id);
 ELSE
  UPDATE public.agency_quotes SET client_id=(p_payload->>'clientId')::UUID,trip_uuid=NULLIF(p_payload->>'tripId','')::UUID,title=btrim(p_payload->>'title'),introduction=NULLIF(btrim(p_payload->>'introduction'),''),currency=p_payload->>'currency',status=p_payload->>'status',valid_until=NULLIF(p_payload->>'validUntil','')::DATE,updated_by=p_actor_id
  WHERE id=v_id AND workspace_uuid=p_workspace_uuid AND status NOT IN('accepted','rejected','expired');
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='QUOTE_NOT_EDITABLE';END IF;
  DELETE FROM public.agency_quote_variants WHERE quote_id=v_id;
 END IF;
 FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
  INSERT INTO public.agency_quote_variants(quote_id,name,description,amount,position) VALUES(v_id,btrim(v_variant->>'name'),NULLIF(btrim(v_variant->>'description'),''),(v_variant->>'amount')::NUMERIC,v_position);v_position:=v_position+1;
 END LOOP;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.save_agency_quote(UUID,UUID,JSONB,JSONB,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_quote(UUID,UUID,JSONB,JSONB,UUID) TO service_role;
NOTIFY pgrst,'reload schema';COMMIT;
