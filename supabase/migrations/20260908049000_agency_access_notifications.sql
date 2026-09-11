-- Meld Agency-rol- en rechtenwijzigingen atomair aan de betrokken medewerkers.
-- Uitvoeren na 20260908048000_manage_agency_quote_shares.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote','agency_access'));

CREATE OR REPLACE FUNCTION public.save_agency_role_permissions(p_owner_id UUID,p_role TEXT,p_permissions JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID;v_brand TEXT;v_user UUID;
BEGIN
 SELECT workspace_uuid,COALESCE(NULLIF(data->'branding'->>'brandName',''),'GlobeTrotr Agency') INTO v_workspace,v_brand FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency';
 IF NOT FOUND OR p_role NOT IN('advisor','finance') OR NOT private.valid_agency_permissions(p_permissions,false) THEN RETURN false;END IF;
 INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions,updated_by) VALUES(v_workspace,p_role,p_permissions,p_owner_id)
 ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions,updated_at=now(),updated_by=p_owner_id;
 FOR v_user IN SELECT user_id FROM public.workspace_members WHERE workspace_uuid=v_workspace AND role=p_role AND status='active' AND user_id IS NOT NULL LOOP
  INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(v_user,'agency_access','Agency-rechten gewijzigd / Agency permissions changed','role_permissions|'||v_brand||'|'||p_role,'agency-role-permissions:'||v_workspace::TEXT||':'||p_role)
  ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 END LOOP;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_member_permissions(p_owner_id UUID,p_member_user_id UUID,p_overrides JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID;v_brand TEXT;
BEGIN
 SELECT workspace_uuid,COALESCE(NULLIF(data->'branding'->>'brandName',''),'GlobeTrotr Agency') INTO v_workspace,v_brand FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency';
 IF NOT FOUND OR p_member_user_id=p_owner_id OR NOT private.valid_agency_permissions(p_overrides,true) THEN RETURN false;END IF;
 UPDATE public.workspace_members SET permission_overrides=p_overrides,updated_at=now() WHERE workspace_uuid=v_workspace AND user_id=p_member_user_id AND role<>'owner';
 IF NOT FOUND THEN RETURN false;END IF;
 INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(p_member_user_id,'agency_access','Persoonlijke rechten gewijzigd / Personal permissions changed','member_permissions|'||v_brand,'agency-member-permissions:'||v_workspace::TEXT)
 ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.manage_workspace_member(p_member_user_id UUID,p_owner_id UUID,p_action TEXT,p_role TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID;v_brand TEXT;v_changed INTEGER:=0;
BEGIN
 SELECT workspace_uuid,COALESCE(NULLIF(data->'branding'->>'brandName',''),'GlobeTrotr Agency') INTO v_workspace,v_brand FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency';
 IF NOT FOUND OR p_member_user_id=p_owner_id THEN RETURN jsonb_build_object('ok',false);END IF;
 IF p_action='role' AND p_role IN('advisor','finance') THEN
  UPDATE public.workspace_members SET role=p_role,updated_at=now() WHERE workspace_uuid=v_workspace AND user_id=p_member_user_id AND role<>'owner';GET DIAGNOSTICS v_changed=ROW_COUNT;
  IF v_changed>0 THEN INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(p_member_user_id,'agency_access','Agency-rol gewijzigd / Agency role changed','role|'||v_brand||'|'||p_role,'agency-member-role:'||v_workspace::TEXT) ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;END IF;
 ELSIF p_action IN('suspend','restore') THEN
  UPDATE public.workspace_members SET status=CASE p_action WHEN 'suspend' THEN 'suspended' ELSE 'active' END,updated_at=now() WHERE workspace_uuid=v_workspace AND user_id=p_member_user_id AND role<>'owner';GET DIAGNOSTICS v_changed=ROW_COUNT;
  IF v_changed>0 THEN INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(p_member_user_id,'account',CASE p_action WHEN 'suspend' THEN 'Agency-toegang geblokkeerd' ELSE 'Agency-toegang hersteld' END,v_brand,'workspace-access:'||v_workspace::TEXT) ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;END IF;
 ELSIF p_action='remove' THEN
  DELETE FROM public.workspace_members WHERE workspace_uuid=v_workspace AND user_id=p_member_user_id AND role<>'owner';GET DIAGNOSTICS v_changed=ROW_COUNT;
  IF v_changed>0 THEN INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(p_member_user_id,'account','Uit Agency-team verwijderd',v_brand,'workspace-removed:'||v_workspace::TEXT||':'||floor(extract(epoch from now()))::TEXT) ON CONFLICT(user_id,event_key) DO NOTHING;END IF;
 ELSE RETURN jsonb_build_object('ok',false);END IF;
 IF v_changed=0 THEN RETURN jsonb_build_object('ok',false);END IF;RETURN jsonb_build_object('ok',true);
END $$;

REVOKE ALL ON FUNCTION public.save_agency_role_permissions(UUID,TEXT,JSONB),public.save_agency_member_permissions(UUID,UUID,JSONB),public.manage_workspace_member(UUID,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_role_permissions(UUID,TEXT,JSONB),public.save_agency_member_permissions(UUID,UUID,JSONB),public.manage_workspace_member(UUID,UUID,TEXT,TEXT) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
