-- Maak verwijderen van een reisgenoot definitief en ruim dubbele uitnodigingsrijen op.
-- Uitvoeren na 20260908023000_invalidate_declined_and_stale_invitations.sql.
BEGIN;

-- Een gekoppeld lid kan in oudere snapshots naast een ongekoppelde placeholder
-- met hetzelfde e-mailadres staan. De gekoppelde, geaccepteerde rij is leidend.
DELETE FROM public.trip_members AS placeholder
WHERE placeholder.user_id IS NULL
  AND placeholder.role <> 'owner'
  AND EXISTS (
    SELECT 1
    FROM public.trip_members AS linked
    WHERE linked.trip_uuid = placeholder.trip_uuid
      AND linked.user_id IS NOT NULL
      AND linked.status = 'active'
      AND lower(linked.email) = lower(placeholder.email)
  );

-- Ook bij iedere volgende acceptatie blijft precies één gekoppelde ledenrij
-- over, zelfs wanneer een oude browser-snapshot meerdere placeholders bevatte.
CREATE OR REPLACE FUNCTION public.cleanup_accepted_invitation_member_duplicates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL THEN
    DELETE FROM public.trip_members AS placeholder
    WHERE placeholder.trip_uuid = NEW.trip_uuid
      AND placeholder.user_id IS NULL
      AND placeholder.role <> 'owner'
      AND lower(placeholder.email) = lower(NEW.email)
      AND EXISTS (
        SELECT 1 FROM public.trip_members AS linked
        WHERE linked.trip_uuid = NEW.trip_uuid
          AND linked.user_id IS NOT NULL
          AND linked.status = 'active'
          AND lower(linked.email) = lower(NEW.email)
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_accepted_invitation_member_duplicates
  ON public.trip_invitations;
CREATE TRIGGER cleanup_accepted_invitation_member_duplicates
AFTER UPDATE OF accepted_at ON public.trip_invitations
FOR EACH ROW EXECUTE FUNCTION public.cleanup_accepted_invitation_member_duplicates();
REVOKE ALL ON FUNCTION public.cleanup_accepted_invitation_member_duplicates() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.remove_trip_member(
  p_trip_uuid UUID,
  p_member_id TEXT,
  p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_trip_uuid IS NULL OR NULLIF(btrim(p_member_id), '') IS NULL OR p_owner_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trips AS trip
    WHERE trip.trip_uuid = p_trip_uuid
      AND trip.workspace_user_id = p_owner_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'PT403', MESSAGE = 'TRIP_OWNER_REQUIRED';
  END IF;

  SELECT lower(member.email) INTO v_email
  FROM public.trip_members AS member
  WHERE member.trip_uuid = p_trip_uuid
    AND member.id = p_member_id
    AND member.role <> 'owner'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.notifications AS notification
  SET dismissed_at = COALESCE(notification.dismissed_at, now())
  WHERE notification.event_key IN (
    SELECT 'invitation:' || invitation.id::TEXT
    FROM public.trip_invitations AS invitation
    WHERE invitation.trip_uuid = p_trip_uuid
      AND lower(invitation.email) = v_email
  );

  UPDATE public.trip_invitations AS invitation
  SET revoked_at = COALESCE(invitation.revoked_at, now())
  WHERE invitation.trip_uuid = p_trip_uuid
    AND lower(invitation.email) = v_email
    AND invitation.accepted_at IS NULL
    AND invitation.declined_at IS NULL
    AND invitation.revoked_at IS NULL;

  DELETE FROM public.trip_members AS member
  WHERE member.trip_uuid = p_trip_uuid
    AND member.role <> 'owner'
    AND lower(member.email) = v_email;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_trip_member(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_trip_member(UUID, TEXT, UUID) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
