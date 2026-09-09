-- Accepteer uitnodigingen veilig wanneer het account al actief aan de reis is gekoppeld.
-- Uitvoeren na 20260908020000_trip_invitation_responses.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.accept_trip_invitation(p_token_hash TEXT, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_invitation public.trip_invitations%ROWTYPE;
  v_user_email TEXT;
  v_owner_id UUID;
  v_trip_id TEXT;
  v_member_id TEXT;
  v_member_role TEXT;
BEGIN
  IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;
  SELECT invitation.* INTO v_invitation FROM public.trip_invitations AS invitation
  WHERE invitation.token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;

  SELECT lower(auth_user.email) INTO v_user_email FROM auth.users AS auth_user
  WHERE auth_user.id = p_user_id AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_user_email IS NULL OR v_user_email <> lower(v_invitation.email) THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;
  IF v_invitation.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;
  IF v_invitation.declined_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'declined'); END IF;
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'accepted', 'tripId', v_invitation.trip_uuid::TEXT);
  END IF;
  IF v_invitation.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;

  SELECT trip.workspace_user_id, trip.id INTO v_owner_id, v_trip_id
  FROM public.trips AS trip WHERE trip.trip_uuid = v_invitation.trip_uuid;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;

  -- Een bestaande actieve koppeling heeft voorrang op een oude placeholder.
  SELECT member.id, member.role INTO v_member_id, v_member_role
  FROM public.trip_members AS member
  WHERE member.trip_uuid = v_invitation.trip_uuid
    AND member.user_id = p_user_id AND member.status = 'active'
  ORDER BY (member.role = 'owner') DESC, member.accepted_at NULLS LAST
  LIMIT 1 FOR UPDATE;

  IF v_member_id IS NOT NULL THEN
    IF v_member_role <> 'owner' THEN
      UPDATE public.trip_members AS member
      SET role = v_invitation.role, accepted_at = COALESCE(member.accepted_at, now())
      WHERE member.trip_uuid = v_invitation.trip_uuid AND member.id = v_member_id;
    END IF;
    UPDATE public.trip_invitations AS invitation
    SET accepted_at = COALESCE(invitation.accepted_at, now())
    WHERE invitation.id = v_invitation.id;
    RETURN jsonb_build_object(
      'status', CASE WHEN v_member_role = 'owner' THEN 'already_member' ELSE 'accepted' END,
      'tripId', v_invitation.trip_uuid::TEXT
    );
  END IF;

  SELECT member.id INTO v_member_id FROM public.trip_members AS member
  WHERE member.trip_uuid = v_invitation.trip_uuid AND member.role <> 'owner'
    AND member.user_id IS NULL AND lower(member.email) = v_user_email
  ORDER BY member.invited_at LIMIT 1 FOR UPDATE;

  IF v_member_id IS NULL THEN
    v_member_id := 'invite-' || v_invitation.id::TEXT;
    INSERT INTO public.trip_members (
      workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
      role, status, invited_at, accepted_at
    ) VALUES (
      v_owner_id, v_trip_id, v_invitation.trip_uuid, v_member_id, p_user_id,
      split_part(v_invitation.email, '@', 1), lower(v_invitation.email),
      v_invitation.role, 'active', v_invitation.created_at, now()
    );
  ELSE
    UPDATE public.trip_members AS member
    SET user_id = p_user_id, role = v_invitation.role, status = 'active',
        accepted_at = COALESCE(member.accepted_at, now())
    WHERE member.trip_uuid = v_invitation.trip_uuid AND member.id = v_member_id;
  END IF;

  UPDATE public.trip_invitations AS invitation
  SET accepted_at = COALESCE(invitation.accepted_at, now())
  WHERE invitation.id = v_invitation.id;
  RETURN jsonb_build_object('status', 'accepted', 'tripId', v_invitation.trip_uuid::TEXT);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_trip_invitation(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_trip_invitation(TEXT, UUID) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
