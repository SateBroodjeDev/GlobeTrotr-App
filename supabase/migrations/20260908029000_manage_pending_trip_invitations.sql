-- Laat uitsluitend de reiseigenaar een open uitnodiging intrekken of vernieuwen.
-- Uitvoeren na 20260908028000_platform_status_lifecycle.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.manage_trip_invitation(
  p_invitation_id UUID,
  p_trip_uuid UUID,
  p_owner_id UUID,
  p_action TEXT,
  p_token_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.trip_invitations%ROWTYPE;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_invitation_id IS NULL OR p_trip_uuid IS NULL OR p_owner_id IS NULL
    OR p_action NOT IN ('revoke', 'renew') THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.trips AS trip
    WHERE trip.trip_uuid = p_trip_uuid AND trip.workspace_user_id = p_owner_id
  ) THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;

  SELECT invitation.* INTO v_invitation
  FROM public.trip_invitations AS invitation
  WHERE invitation.id = p_invitation_id
    AND invitation.trip_uuid = p_trip_uuid
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF v_invitation.accepted_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'accepted'); END IF;
  IF v_invitation.declined_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'declined'); END IF;
  IF v_invitation.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;

  IF p_action = 'revoke' THEN
    UPDATE public.trip_invitations AS invitation
    SET revoked_at = now(),
        token_hash = md5(invitation.id::TEXT || random()::TEXT)
          || md5(clock_timestamp()::TEXT || random()::TEXT)
    WHERE invitation.id = p_invitation_id;
    UPDATE public.notifications AS notification
    SET dismissed_at = COALESCE(notification.dismissed_at, now())
    WHERE notification.event_key = 'invitation:' || p_invitation_id::TEXT;
    DELETE FROM public.trip_members AS member
    WHERE member.trip_uuid = p_trip_uuid
      AND member.user_id IS NULL
      AND member.role <> 'owner'
      AND lower(member.email) = lower(v_invitation.email);
    RETURN jsonb_build_object('status', 'revoked');
  END IF;

  IF p_token_hash IS NULL OR length(p_token_hash) <> 64 THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;
  v_expires_at := now() + interval '7 days';
  UPDATE public.trip_invitations AS invitation
  SET token_hash = p_token_hash, expires_at = v_expires_at
  WHERE invitation.id = p_invitation_id;

  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  SELECT auth_user.id, 'invitation', 'Reisuitnodiging',
    'Je bent uitgenodigd voor ' || trip.name || '.', p_trip_uuid,
    'invitation:' || p_invitation_id::TEXT
  FROM auth.users AS auth_user
  JOIN public.trips AS trip ON trip.trip_uuid = p_trip_uuid
  WHERE lower(auth_user.email) = lower(v_invitation.email)
    AND auth_user.email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id, event_key) DO UPDATE
  SET title = EXCLUDED.title, body = EXCLUDED.body, trip_uuid = EXCLUDED.trip_uuid,
      dismissed_at = NULL, created_at = now();

  RETURN jsonb_build_object('status', 'renewed', 'expiresAt', v_expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.manage_trip_invitation(UUID, UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_trip_invitation(UUID, UUID, UUID, TEXT, TEXT)
  TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
