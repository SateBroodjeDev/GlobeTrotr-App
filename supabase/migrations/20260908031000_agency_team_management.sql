-- Veilige levenscyclus voor Agency-teamleden en workspace-uitnodigingen.
-- Uitvoeren na 20260908030000_agency_workspace_members.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.respond_workspace_invitation(
  p_token_hash TEXT, p_user_id UUID, p_response TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_invitation public.workspace_invitations%ROWTYPE;
  v_email TEXT;
  v_workspace_name TEXT;
BEGIN
  IF p_response NOT IN ('accept', 'decline') THEN
    RAISE EXCEPTION 'Ongeldig antwoord.';
  END IF;
  SELECT * INTO v_invitation FROM public.workspace_invitations
  WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  IF v_invitation.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;
  IF v_invitation.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  IF v_invitation.accepted_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'accepted', 'workspaceId', v_invitation.workspace_uuid); END IF;
  IF v_invitation.declined_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'declined'); END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS DISTINCT FROM lower(v_invitation.email) THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspace_uuid = v_invitation.workspace_uuid AND plan = 'agency'
  ) THEN RETURN jsonb_build_object('status', 'unavailable'); END IF;

  IF p_response = 'decline' THEN
    UPDATE public.workspace_invitations SET declined_at = now(), token_hash =
      replace(pg_catalog.gen_random_uuid()::TEXT, '-', '') || replace(pg_catalog.gen_random_uuid()::TEXT, '-', '')
    WHERE id = v_invitation.id;
  ELSE
    INSERT INTO public.workspace_members(workspace_uuid, user_id, role, status, invited_at, joined_at)
    VALUES (v_invitation.workspace_uuid, p_user_id, v_invitation.role, 'active', v_invitation.created_at, now())
    ON CONFLICT (workspace_uuid, user_id) DO UPDATE SET
      role = EXCLUDED.role, status = 'active', joined_at = COALESCE(public.workspace_members.joined_at, now()), updated_at = now();
    UPDATE public.workspace_invitations SET accepted_at = now(), token_hash =
      replace(pg_catalog.gen_random_uuid()::TEXT, '-', '') || replace(pg_catalog.gen_random_uuid()::TEXT, '-', '')
    WHERE id = v_invitation.id;
  END IF;

  UPDATE public.notifications SET dismissed_at = now()
  WHERE user_id = p_user_id AND event_key = 'workspace-invitation:' || v_invitation.id::TEXT;
  SELECT COALESCE(data->'branding'->>'brandName', 'GlobeTrotr Agency') INTO v_workspace_name
  FROM public.workspaces WHERE workspace_uuid = v_invitation.workspace_uuid;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  VALUES (v_invitation.invited_by, 'account',
    CASE p_response WHEN 'accept' THEN 'Agency-uitnodiging geaccepteerd' ELSE 'Agency-uitnodiging geweigerd' END,
    v_invitation.email || '|' || v_workspace_name,
    'workspace-invitation-response:' || p_response || ':' || v_invitation.id::TEXT)
  ON CONFLICT (user_id, event_key) DO UPDATE SET body = EXCLUDED.body, created_at = now(), dismissed_at = NULL;
  RETURN jsonb_build_object('status', CASE p_response WHEN 'accept' THEN 'accepted' ELSE 'declined' END,
    'workspaceId', v_invitation.workspace_uuid);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_workspace_invitation(
  p_invitation_id UUID, p_owner_id UUID, p_action TEXT, p_token_hash TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_workspace UUID; v_expiry TIMESTAMPTZ;
BEGIN
  SELECT invitation.workspace_uuid INTO v_workspace
  FROM public.workspace_invitations AS invitation
  JOIN public.workspaces AS workspace ON workspace.workspace_uuid = invitation.workspace_uuid
  WHERE invitation.id = p_invitation_id AND workspace.user_id = p_owner_id AND workspace.plan = 'agency'
  FOR UPDATE OF invitation;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'forbidden'); END IF;
  IF p_action = 'revoke' THEN
    UPDATE public.workspace_invitations SET revoked_at = now(), token_hash =
      replace(pg_catalog.gen_random_uuid()::TEXT, '-', '') || replace(pg_catalog.gen_random_uuid()::TEXT, '-', '')
    WHERE id = p_invitation_id AND accepted_at IS NULL AND declined_at IS NULL;
    UPDATE public.notifications SET dismissed_at = now() WHERE event_key = 'workspace-invitation:' || p_invitation_id::TEXT;
    RETURN jsonb_build_object('status', 'revoked');
  ELSIF p_action = 'renew' AND p_token_hash ~ '^[0-9a-f]{64}$' THEN
    v_expiry := now() + interval '7 days';
    UPDATE public.workspace_invitations SET token_hash = p_token_hash, expires_at = v_expiry,
      accepted_at = NULL, declined_at = NULL, revoked_at = NULL, created_at = now()
    WHERE id = p_invitation_id;
    UPDATE public.notifications SET created_at = now(), dismissed_at = NULL
    WHERE event_key = 'workspace-invitation:' || p_invitation_id::TEXT;
    RETURN jsonb_build_object('status', 'renewed', 'expiresAt', v_expiry);
  END IF;
  RETURN jsonb_build_object('status', 'invalid');
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_workspace_member(
  p_member_user_id UUID, p_owner_id UUID, p_action TEXT, p_role TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_workspace UUID; v_brand TEXT; v_changed INTEGER := 0;
BEGIN
  SELECT workspace_uuid, COALESCE(data->'branding'->>'brandName', 'GlobeTrotr Agency')
  INTO v_workspace, v_brand FROM public.workspaces
  WHERE user_id = p_owner_id AND plan = 'agency';
  IF NOT FOUND OR p_member_user_id = p_owner_id THEN RETURN jsonb_build_object('ok', false); END IF;
  IF p_action = 'role' AND p_role IN ('advisor', 'finance') THEN
    UPDATE public.workspace_members SET role = p_role, updated_at = now()
    WHERE workspace_uuid = v_workspace AND user_id = p_member_user_id AND role <> 'owner';
    GET DIAGNOSTICS v_changed = ROW_COUNT;
  ELSIF p_action IN ('suspend', 'restore') THEN
    UPDATE public.workspace_members SET status = CASE p_action WHEN 'suspend' THEN 'suspended' ELSE 'active' END, updated_at = now()
    WHERE workspace_uuid = v_workspace AND user_id = p_member_user_id AND role <> 'owner';
    GET DIAGNOSTICS v_changed = ROW_COUNT;
    IF v_changed = 0 THEN RETURN jsonb_build_object('ok', false); END IF;
    INSERT INTO public.notifications(user_id, kind, title, body, event_key)
    VALUES (p_member_user_id, 'account',
      CASE p_action WHEN 'suspend' THEN 'Agency-toegang geblokkeerd' ELSE 'Agency-toegang hersteld' END,
      v_brand, 'workspace-access:' || v_workspace::TEXT)
    ON CONFLICT (user_id, event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  ELSIF p_action = 'remove' THEN
    DELETE FROM public.workspace_members WHERE workspace_uuid = v_workspace AND user_id = p_member_user_id AND role <> 'owner';
    GET DIAGNOSTICS v_changed = ROW_COUNT;
    IF v_changed = 0 THEN RETURN jsonb_build_object('ok', false); END IF;
    INSERT INTO public.notifications(user_id, kind, title, body, event_key)
    VALUES (p_member_user_id, 'account', 'Uit Agency-team verwijderd', v_brand,
      'workspace-removed:' || v_workspace::TEXT || ':' || floor(extract(epoch from now()))::TEXT)
    ON CONFLICT (user_id, event_key) DO NOTHING;
  ELSE RETURN jsonb_build_object('ok', false); END IF;
  IF v_changed = 0 THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_workspace_invitation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_name TEXT;
BEGIN
  SELECT COALESCE(data->'branding'->>'brandName', 'GlobeTrotr Agency') INTO v_name
  FROM public.workspaces WHERE workspace_uuid = NEW.workspace_uuid;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  SELECT auth_user.id, 'invitation', 'Agency-uitnodiging',
    'Je bent uitgenodigd voor het team van ' || v_name || '.', 'workspace-invitation:' || NEW.id::TEXT
  FROM auth.users AS auth_user WHERE lower(auth_user.email) = lower(NEW.email)
  ON CONFLICT (user_id, event_key) DO UPDATE SET body = EXCLUDED.body, created_at = now(), dismissed_at = NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS workspace_invitations_notify ON public.workspace_invitations;
CREATE TRIGGER workspace_invitations_notify AFTER INSERT ON public.workspace_invitations
FOR EACH ROW EXECUTE FUNCTION private.notify_workspace_invitation();

REVOKE ALL ON FUNCTION public.respond_workspace_invitation(TEXT, UUID, TEXT),
  public.manage_workspace_invitation(UUID, UUID, TEXT, TEXT),
  public.manage_workspace_member(UUID, UUID, TEXT, TEXT), private.notify_workspace_invitation()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_workspace_invitation(TEXT, UUID, TEXT),
  public.manage_workspace_invitation(UUID, UUID, TEXT, TEXT),
  public.manage_workspace_member(UUID, UUID, TEXT, TEXT) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
