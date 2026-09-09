-- Ruim een geweigerde reisgenoot op en publiceer platformberichten atomair.
-- Uitvoeren na 20260908026000_notification_lifecycle.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.cleanup_declined_invitation_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.declined_at IS NOT NULL AND OLD.declined_at IS NULL THEN
    DELETE FROM public.trip_members AS member
    WHERE member.trip_uuid = NEW.trip_uuid
      AND member.user_id IS NULL
      AND member.role <> 'owner'
      AND lower(member.email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trip_invitation_decline_cleanup ON public.trip_invitations;
CREATE TRIGGER trip_invitation_decline_cleanup
AFTER UPDATE OF declined_at ON public.trip_invitations
FOR EACH ROW EXECUTE FUNCTION private.cleanup_declined_invitation_member();

-- Herstel placeholders die vóór deze migratie na een weigering zijn blijven staan.
DELETE FROM public.trip_members AS member
USING public.trip_invitations AS invitation
WHERE member.trip_uuid = invitation.trip_uuid
  AND member.user_id IS NULL
  AND member.role <> 'owner'
  AND lower(member.email) = lower(invitation.email)
  AND invitation.declined_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.trip_invitations AS open_invitation
    WHERE open_invitation.trip_uuid = invitation.trip_uuid
      AND lower(open_invitation.email) = lower(invitation.email)
      AND open_invitation.accepted_at IS NULL
      AND open_invitation.declined_at IS NULL
      AND open_invitation.revoked_at IS NULL
      AND open_invitation.expires_at > now()
  );

CREATE OR REPLACE FUNCTION public.publish_platform_announcement(
  p_actor_id UUID,
  p_announcement_type TEXT,
  p_severity TEXT,
  p_title_nl TEXT,
  p_title_en TEXT,
  p_body_nl TEXT,
  p_body_en TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins AS admin
    WHERE admin.user_id = p_actor_id AND admin.active = true
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'PT403', MESSAGE = 'FORBIDDEN';
  END IF;

  INSERT INTO public.platform_announcements(
    announcement_type, severity, title_nl, title_en, body_nl, body_en,
    created_by
  ) VALUES (
    p_announcement_type, p_severity, btrim(p_title_nl), btrim(p_title_en),
    btrim(p_body_nl), btrim(p_body_en), p_actor_id
  ) RETURNING id INTO v_id;

  -- De bestaande notificatietrigger vuurt bij deze overgang één keer af.
  UPDATE public.platform_announcements
  SET published_at = now()
  WHERE id = v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION private.cleanup_declined_invitation_member()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_platform_announcement(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_platform_announcement(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
