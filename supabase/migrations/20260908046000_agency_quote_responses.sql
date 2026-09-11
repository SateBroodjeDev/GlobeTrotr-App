-- Atomaire klantrespons op een veilig gedeelde Agency-offerte.
-- Uitvoeren na 20260908045000_secure_agency_quote_sharing.sql.
BEGIN;
ALTER TABLE public.agency_quotes ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE public.agency_quotes ADD COLUMN IF NOT EXISTS response_note TEXT;
ALTER TABLE public.agency_quotes DROP CONSTRAINT IF EXISTS agency_quotes_response_note_check;
ALTER TABLE public.agency_quotes ADD CONSTRAINT agency_quotes_response_note_check CHECK(response_note IS NULL OR char_length(response_note)<=500);
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote'));

CREATE OR REPLACE FUNCTION public.respond_agency_quote(p_token_hash TEXT,p_response TEXT,p_variant_id UUID DEFAULT NULL,p_note TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_quote public.agency_quotes%ROWTYPE;v_client_name TEXT;v_variant_name TEXT;v_user UUID;
BEGIN
 IF p_token_hash!~'^[0-9a-f]{64}$' OR p_response NOT IN('accept','reject') OR char_length(COALESCE(p_note,''))>500 THEN RETURN jsonb_build_object('status','invalid');END IF;
 SELECT * INTO v_quote FROM public.agency_quotes WHERE share_token_hash=p_token_hash FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid');END IF;
 IF v_quote.status IN('accepted','rejected') THEN RETURN jsonb_build_object('status',v_quote.status);END IF;
 IF v_quote.status<>'ready' OR v_quote.share_expires_at<=now() OR (v_quote.valid_until IS NOT NULL AND v_quote.valid_until<current_date) THEN RETURN jsonb_build_object('status','expired');END IF;
 IF p_response='accept' THEN
  IF p_variant_id IS NULL THEN RETURN jsonb_build_object('status','variant_required');END IF;
  SELECT name INTO v_variant_name FROM public.agency_quote_variants WHERE id=p_variant_id AND quote_id=v_quote.id;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid_variant');END IF;
  UPDATE public.agency_quotes SET status='accepted',accepted_variant_id=p_variant_id,responded_at=now(),response_note=NULLIF(btrim(p_note),'') WHERE id=v_quote.id;
 ELSE
  IF p_variant_id IS NOT NULL THEN RETURN jsonb_build_object('status','invalid');END IF;
  UPDATE public.agency_quotes SET status='rejected',accepted_variant_id=NULL,responded_at=now(),response_note=NULLIF(btrim(p_note),'') WHERE id=v_quote.id;
 END IF;
 SELECT full_name INTO v_client_name FROM public.agency_clients WHERE id=v_quote.client_id;
 FOR v_user IN SELECT user_id FROM public.workspaces WHERE workspace_uuid=v_quote.workspace_uuid UNION SELECT user_id FROM public.workspace_members WHERE workspace_uuid=v_quote.workspace_uuid AND status='active' AND user_id IS NOT NULL LOOP
  INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(v_user,'agency_quote','Offerte beantwoord / Quote answered',p_response||'|'||COALESCE(v_client_name,'Klant')||'|'||v_quote.title||'|'||COALESCE(v_variant_name,''),'agency-quote-response:'||v_quote.id::TEXT) ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 END LOOP;
 INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id,context) VALUES(v_quote.workspace_uuid,NULL,'quote.'||p_response,'quote',v_quote.id::TEXT,jsonb_build_object('variantId',p_variant_id));
 RETURN jsonb_build_object('status',CASE WHEN p_response='accept' THEN 'accepted' ELSE 'rejected' END);
END $$;
REVOKE ALL ON FUNCTION public.respond_agency_quote(TEXT,TEXT,UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.respond_agency_quote(TEXT,TEXT,UUID,TEXT) TO service_role;
NOTIFY pgrst,'reload schema';COMMIT;
