-- Maak geweigerde links direct ongeldig en sluit oude uitnodigingen voor
-- accounts die al actief aan dezelfde reis deelnemen.
-- Uitvoeren na 20260908022000_resolve_existing_invitation_memberships.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.decline_trip_invitation(
  p_token_hash TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.trip_invitations%ROWTYPE;
  v_user_email TEXT;
BEGIN
  IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;
  SELECT invitation.* INTO v_invitation
  FROM public.trip_invitations AS invitation
  WHERE invitation.token_hash = p_token_hash
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;

  SELECT lower(auth_user.email) INTO v_user_email
  FROM auth.users AS auth_user
  WHERE auth_user.id = p_user_id AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_user_email IS NULL OR v_user_email <> lower(v_invitation.email) THEN
    RETURN jsonb_build_object('status', 'forbidden');
  END IF;
  IF v_invitation.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;
  IF v_invitation.accepted_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'accepted'); END IF;
  IF v_invitation.declined_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'declined'); END IF;
  IF v_invitation.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;

  UPDATE public.trip_invitations AS invitation
  SET declined_at = now(),
      -- Bewaar de rij voor audit, maar verbreek de koppeling met de gedeelde link.
      token_hash = md5(invitation.id::TEXT || random()::TEXT)
        || md5(clock_timestamp()::TEXT || random()::TEXT)
  WHERE invitation.id = v_invitation.id;

  UPDATE public.notifications AS notification
  SET dismissed_at = COALESCE(notification.dismissed_at, now())
  WHERE notification.user_id = p_user_id
    AND notification.event_key = 'invitation:' || v_invitation.id::TEXT;

  RETURN jsonb_build_object('status', 'declined');
END;
$$;

-- Links van reeds geweigerde uitnodigingen uit oudere versies mogen ook niet
-- langer naar een inhoudelijke uitnodigingspagina leiden.
UPDATE public.trip_invitations AS invitation
SET token_hash = md5(invitation.id::TEXT || random()::TEXT)
  || md5(clock_timestamp()::TEXT || random()::TEXT)
WHERE invitation.declined_at IS NOT NULL;

-- Een oude open uitnodiging is overbodig wanneer het bevestigde account al
-- als actief lid (of eigenaar) aan exact dezelfde reis gekoppeld is.
UPDATE public.trip_invitations AS invitation
SET accepted_at = now()
FROM auth.users AS auth_user
JOIN public.trip_members AS member
  ON member.user_id = auth_user.id
 AND member.status = 'active'
WHERE invitation.trip_uuid = member.trip_uuid
  AND lower(invitation.email) = lower(auth_user.email)
  AND auth_user.email_confirmed_at IS NOT NULL
  AND invitation.accepted_at IS NULL
  AND invitation.declined_at IS NULL
  AND invitation.revoked_at IS NULL;

UPDATE public.notifications AS notification
SET dismissed_at = COALESCE(notification.dismissed_at, now())
FROM public.trip_invitations AS invitation
WHERE notification.event_key = 'invitation:' || invitation.id::TEXT
  AND (invitation.accepted_at IS NOT NULL OR invitation.declined_at IS NOT NULL
    OR invitation.revoked_at IS NOT NULL OR invitation.expires_at <= now());

CREATE OR REPLACE FUNCTION private.notify_trip_invitation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  SELECT auth_user.id, 'invitation', 'Reisuitnodiging',
    'Je bent uitgenodigd voor ' || trip.name || '.',
    NEW.trip_uuid, 'invitation:' || NEW.id::TEXT
  FROM auth.users AS auth_user
  JOIN public.trips AS trip ON trip.trip_uuid = NEW.trip_uuid
  WHERE lower(auth_user.email) = lower(NEW.email)
    AND auth_user.email_confirmed_at IS NOT NULL
    AND NEW.accepted_at IS NULL AND NEW.declined_at IS NULL
    AND NEW.revoked_at IS NULL AND NEW.expires_at > now()
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_pending_invitations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
    SELECT NEW.id, 'invitation', 'Reisuitnodiging',
      'Je bent uitgenodigd voor ' || trip.name || '.',
      invitation.trip_uuid, 'invitation:' || invitation.id::TEXT
    FROM public.trip_invitations AS invitation
    JOIN public.trips AS trip ON trip.trip_uuid = invitation.trip_uuid
    WHERE lower(invitation.email) = lower(NEW.email)
      AND invitation.accepted_at IS NULL AND invitation.declined_at IS NULL
      AND invitation.revoked_at IS NULL AND invitation.expires_at > now()
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.decline_trip_invitation(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_trip_invitation(TEXT, UUID) TO service_role;
REVOKE ALL ON FUNCTION private.notify_trip_invitation(), private.notify_pending_invitations()
  FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
