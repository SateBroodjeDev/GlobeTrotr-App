-- Maak delen, vernieuwen en intrekken van offertes zichtbaar en auditbaar.
-- Uitvoeren na 20260908053000_agency_client_notifications.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.notify_agency_quote_team(
 p_workspace_uuid UUID,p_actor_id UUID,p_quote_id UUID,p_action TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user UUID;v_title TEXT;v_client TEXT;
BEGIN
 SELECT quote.title,client.full_name INTO v_title,v_client FROM public.agency_quotes quote
 JOIN public.agency_clients client ON client.id=quote.client_id
 WHERE quote.id=p_quote_id AND quote.workspace_uuid=p_workspace_uuid;
 IF NOT FOUND THEN RETURN;END IF;
 FOR v_user IN
  SELECT workspace.user_id FROM public.workspaces workspace WHERE workspace.workspace_uuid=p_workspace_uuid
  UNION
  SELECT member.user_id FROM public.workspace_members member
   WHERE member.workspace_uuid=p_workspace_uuid AND member.status='active' AND member.user_id IS NOT NULL
    AND private.agency_actor_has_permission(p_workspace_uuid,member.user_id,'trips_view')
 LOOP
  IF v_user IS DISTINCT FROM p_actor_id AND NOT EXISTS(
   SELECT 1 FROM public.agency_notification_preferences preference
    WHERE preference.workspace_uuid=p_workspace_uuid AND preference.user_id=v_user
     AND preference.client_updates=false
  ) THEN
   INSERT INTO public.notifications(user_id,kind,title,body,event_key)
   VALUES(v_user,'agency_quote','Offerte bijgewerkt / Quote updated',
    p_action||'|'||left(replace(v_client,'|',''),100)||'|'||left(replace(v_title,'|',''),120)||'|',
    'agency-quote-lifecycle:'||p_quote_id::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_quote(
 p_workspace_uuid UUID,p_quote_id UUID,p_payload JSONB,p_variants JSONB,p_actor_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id UUID:=COALESCE(p_quote_id,gen_random_uuid());v_variant JSONB;v_position INTEGER:=0;v_action TEXT;
BEGIN
 IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'trips_plan') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';END IF;
 IF jsonb_typeof(p_payload)<>'object' OR jsonb_typeof(p_variants)<>'array' OR jsonb_array_length(p_variants)<1 OR jsonb_array_length(p_variants)>10 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_QUOTE';END IF;
 IF p_quote_id IS NULL THEN
  v_action:='quote.create';
  INSERT INTO public.agency_quotes(id,workspace_uuid,client_id,trip_uuid,title,introduction,currency,status,valid_until,created_by,updated_by)
  VALUES(v_id,p_workspace_uuid,(p_payload->>'clientId')::UUID,NULLIF(p_payload->>'tripId','')::UUID,btrim(p_payload->>'title'),NULLIF(btrim(p_payload->>'introduction'),''),p_payload->>'currency',p_payload->>'status',NULLIF(p_payload->>'validUntil','')::DATE,p_actor_id,p_actor_id);
 ELSE
  v_action:='quote.update';
  UPDATE public.agency_quotes SET client_id=(p_payload->>'clientId')::UUID,trip_uuid=NULLIF(p_payload->>'tripId','')::UUID,title=btrim(p_payload->>'title'),introduction=NULLIF(btrim(p_payload->>'introduction'),''),currency=p_payload->>'currency',status=p_payload->>'status',valid_until=NULLIF(p_payload->>'validUntil','')::DATE,updated_by=p_actor_id
  WHERE id=v_id AND workspace_uuid=p_workspace_uuid AND status NOT IN('accepted','rejected','expired');
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='QUOTE_NOT_EDITABLE';END IF;
  DELETE FROM public.agency_quote_variants WHERE quote_id=v_id;
 END IF;
 FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants) LOOP
  INSERT INTO public.agency_quote_variants(quote_id,name,description,amount,position)
  VALUES(v_id,btrim(v_variant->>'name'),NULLIF(btrim(v_variant->>'description'),''),(v_variant->>'amount')::NUMERIC,v_position);v_position:=v_position+1;
 END LOOP;
 INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id,context)
 VALUES(p_workspace_uuid,p_actor_id,v_action,'quote',v_id::TEXT,jsonb_build_object('variantCount',jsonb_array_length(p_variants)));
 RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.prepare_agency_quote_share(
 p_workspace_uuid UUID,p_quote_id UUID,p_token_hash TEXT,p_expires_at TIMESTAMPTZ,p_actor_id UUID
) RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_now TIMESTAMPTZ:=now();v_had_share BOOLEAN;v_action TEXT;
BEGIN
 IF p_token_hash!~'^[0-9a-f]{64}$' OR p_expires_at<=v_now OR p_expires_at>v_now+interval '31 days' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_QUOTE_SHARE';END IF;
 IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'trips_plan') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';END IF;
 SELECT share_token_hash IS NOT NULL INTO v_had_share FROM public.agency_quotes
  WHERE id=p_quote_id AND workspace_uuid=p_workspace_uuid AND status='ready' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='QUOTE_NOT_SHAREABLE';END IF;
 UPDATE public.agency_quotes SET share_token_hash=p_token_hash,shared_at=v_now,
  share_expires_at=p_expires_at,updated_by=p_actor_id WHERE id=p_quote_id;
 v_action:=CASE WHEN v_had_share THEN 'renewed' ELSE 'shared' END;
 INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id,context)
 VALUES(p_workspace_uuid,p_actor_id,'quote.share_'||v_action,'quote',p_quote_id::TEXT,jsonb_build_object('expiresAt',p_expires_at));
 PERFORM private.notify_agency_quote_team(p_workspace_uuid,p_actor_id,p_quote_id,v_action);
 RETURN p_expires_at;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_agency_quote_share(
 p_workspace_uuid UUID,p_quote_id UUID,p_actor_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'trips_plan') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';END IF;
 UPDATE public.agency_quotes SET share_token_hash=NULL,shared_at=NULL,share_expires_at=NULL,updated_by=p_actor_id
  WHERE id=p_quote_id AND workspace_uuid=p_workspace_uuid AND share_token_hash IS NOT NULL;
 IF NOT FOUND THEN RETURN false;END IF;
 INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id)
 VALUES(p_workspace_uuid,p_actor_id,'quote.share_revoke','quote',p_quote_id::TEXT);
 PERFORM private.notify_agency_quote_team(p_workspace_uuid,p_actor_id,p_quote_id,'revoked');
 RETURN true;
END $$;

REVOKE ALL ON FUNCTION private.notify_agency_quote_team(UUID,UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_agency_quote(UUID,UUID,JSONB,JSONB,UUID),public.prepare_agency_quote_share(UUID,UUID,TEXT,TIMESTAMPTZ,UUID),public.revoke_agency_quote_share(UUID,UUID,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_quote(UUID,UUID,JSONB,JSONB,UUID),public.prepare_agency_quote_share(UUID,UUID,TEXT,TIMESTAMPTZ,UUID),public.revoke_agency_quote_share(UUID,UUID,UUID) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
