-- Meld de uitnodiger wanneer een reisuitnodiging wordt geaccepteerd of geweigerd.
-- Uitvoeren na 20260908024000_remove_members_and_deduplicate.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.notify_trip_invitation_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip_name TEXT;
  v_response TEXT;
BEGIN
  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL THEN
    v_response := 'accepted';
  ELSIF NEW.declined_at IS NOT NULL AND OLD.declined_at IS NULL THEN
    v_response := 'declined';
  ELSE
    RETURN NEW;
  END IF;

  SELECT trip.name INTO v_trip_name
  FROM public.trips AS trip WHERE trip.trip_uuid = NEW.trip_uuid;

  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  VALUES (
    NEW.invited_by,
    'invitation',
    CASE WHEN v_response = 'accepted' THEN 'Uitnodiging geaccepteerd' ELSE 'Uitnodiging geweigerd' END,
    lower(NEW.email) || '|' || COALESCE(v_trip_name, 'Reis'),
    NEW.trip_uuid,
    'invitation-response:' || v_response || ':' || NEW.id::TEXT
  )
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invitations_notify_response ON public.trip_invitations;
CREATE TRIGGER invitations_notify_response
AFTER UPDATE OF accepted_at, declined_at ON public.trip_invitations
FOR EACH ROW EXECUTE FUNCTION private.notify_trip_invitation_response();

REVOKE ALL ON FUNCTION private.notify_trip_invitation_response() FROM PUBLIC, anon, authenticated;
COMMIT;
