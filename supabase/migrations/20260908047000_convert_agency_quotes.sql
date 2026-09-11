-- Zet een geaccepteerde offerte éénmalig om naar een gekoppelde of nieuwe privéreis.
-- Uitvoeren na 20260908046000_agency_quote_responses.sql.
BEGIN;
ALTER TABLE public.agency_quotes ADD COLUMN IF NOT EXISTS converted_trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE SET NULL;
ALTER TABLE public.agency_quotes ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.agency_quotes ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.convert_agency_quote(p_workspace_uuid UUID,p_quote_id UUID,p_actor_id UUID,p_trip JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_quote public.agency_quotes%ROWTYPE;v_variant public.agency_quote_variants%ROWTYPE;v_trip UUID;v_owner UUID;v_legacy_id TEXT;v_name TEXT;v_start DATE;v_end DATE;v_client public.agency_clients%ROWTYPE;v_client_user UUID;v_user UUID;
BEGIN
 IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'trips_create') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';END IF;
 SELECT * INTO v_quote FROM public.agency_quotes WHERE id=p_quote_id AND workspace_uuid=p_workspace_uuid FOR UPDATE;
 IF NOT FOUND OR v_quote.status<>'accepted' OR v_quote.accepted_variant_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='QUOTE_NOT_ACCEPTED';END IF;
 IF v_quote.converted_trip_uuid IS NOT NULL THEN RETURN v_quote.converted_trip_uuid;END IF;
 SELECT * INTO v_variant FROM public.agency_quote_variants WHERE id=v_quote.accepted_variant_id AND quote_id=v_quote.id;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='QUOTE_VARIANT_MISSING';END IF;
 IF v_quote.trip_uuid IS NOT NULL THEN
  v_trip:=v_quote.trip_uuid;SELECT name,id,workspace_user_id INTO v_name,v_legacy_id,v_owner FROM public.trips WHERE trip_uuid=v_trip AND workspace_uuid=p_workspace_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='LINKED_TRIP_UNAVAILABLE';END IF;
 ELSE
  v_name:=btrim(COALESCE(p_trip->>'name',''));v_start:=NULLIF(p_trip->>'start','')::DATE;v_end:=NULLIF(p_trip->>'end','')::DATE;
  IF jsonb_typeof(p_trip)<>'object' OR char_length(v_name) NOT BETWEEN 1 AND 30 OR v_start IS NULL OR v_end IS NULL OR v_end<v_start THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_TRIP';END IF;
  SELECT user_id INTO v_owner FROM public.workspaces WHERE workspace_uuid=p_workspace_uuid AND plan='agency';
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='WORKSPACE_UNAVAILABLE';END IF;
  v_trip:=gen_random_uuid();v_legacy_id:=v_trip::TEXT;
  INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name,description,template,start_date,end_date,budget,is_public)
  VALUES(v_owner,p_workspace_uuid,v_trip::TEXT,v_trip,v_name,left(NULLIF(v_quote.introduction,''),375),COALESCE(NULLIF(p_trip->>'template',''),'citytrip'),v_start,v_end,v_variant.amount,false);
 END IF;
 INSERT INTO public.agency_client_trips(client_id,trip_uuid,linked_by) VALUES(v_quote.client_id,v_trip,p_actor_id) ON CONFLICT DO NOTHING;
 SELECT * INTO v_client FROM public.agency_clients WHERE id=v_quote.client_id;
 IF v_client.status='active' AND v_client.email IS NOT NULL THEN
  SELECT id INTO v_client_user FROM auth.users WHERE lower(email)=lower(v_client.email) LIMIT 1;
  IF v_client_user IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.trip_members WHERE trip_uuid=v_trip AND user_id=v_client_user) THEN
   SELECT workspace_user_id,id INTO v_owner,v_legacy_id FROM public.trips WHERE trip_uuid=v_trip;
   INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,invited_at,accepted_at,agency_client_id)
   VALUES(v_owner,v_legacy_id,v_trip,'agency-client:'||v_quote.client_id::TEXT,v_client_user,v_client.full_name,v_client.email,'client','active',now(),now(),v_quote.client_id);
  END IF;
 END IF;
 UPDATE public.agency_quotes SET converted_trip_uuid=v_trip,converted_at=now(),converted_by=p_actor_id WHERE id=v_quote.id;
 FOR v_user IN SELECT user_id FROM public.workspaces WHERE workspace_uuid=p_workspace_uuid UNION SELECT user_id FROM public.workspace_members WHERE workspace_uuid=p_workspace_uuid AND status='active' AND user_id IS NOT NULL LOOP
  IF v_user<>p_actor_id THEN INSERT INTO public.notifications(user_id,kind,title,body,event_key,trip_uuid) VALUES(v_user,'agency_quote','Offerte omgezet / Quote converted','converted|'||v_client.full_name||'|'||v_quote.title||'|'||v_name,'agency-quote-converted:'||v_quote.id::TEXT,v_trip) ON CONFLICT(user_id,event_key) DO NOTHING;END IF;
 END LOOP;
 INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id,context) VALUES(p_workspace_uuid,p_actor_id,'quote.convert','quote',v_quote.id::TEXT,jsonb_build_object('tripId',v_trip));
 RETURN v_trip;
END $$;
REVOKE ALL ON FUNCTION public.convert_agency_quote(UUID,UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.convert_agency_quote(UUID,UUID,UUID,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';COMMIT;
