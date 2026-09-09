-- Uitvoeren na 20260908025000_notify_invitation_responses.sql.
-- Controleert dubbele acceptatieregels en definitief verwijderen door de eigenaar.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE member_cleanup_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS member_id,
  gen_random_uuid() AS declined_id,
  gen_random_uuid() AS trip_id, gen_random_uuid() AS invitation_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM member_cleanup_ids
UNION ALL
SELECT member_id, member_id::TEXT || '@example.invalid', now() FROM member_cleanup_ids;
INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT declined_id, declined_id::TEXT || '@example.invalid', now() FROM member_cleanup_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM member_cleanup_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Ledenopruimtest' FROM member_cleanup_ids;

INSERT INTO public.trip_members(
  workspace_user_id, trip_id, trip_uuid, id, name, email, role, status
)
SELECT owner_id, trip_id::TEXT, trip_id, 'placeholder-een', 'Testlid',
  member_id::TEXT || '@example.invalid', 'traveler', 'invited'
FROM member_cleanup_ids
UNION ALL
SELECT owner_id, trip_id::TEXT, trip_id, 'placeholder-twee', 'Testlid dubbel',
  member_id::TEXT || '@example.invalid', 'traveler', 'invited'
FROM member_cleanup_ids;

INSERT INTO public.trip_invitations(
  trip_uuid, email, role, token_hash, invited_by, expires_at
)
SELECT trip_id, declined_id::TEXT || '@example.invalid', 'viewer',
  repeat('e', 64), owner_id, now() + interval '1 day'
FROM member_cleanup_ids;

INSERT INTO public.trip_invitations(
  id, trip_uuid, email, role, token_hash, invited_by, expires_at
)
SELECT invitation_id, trip_id, member_id::TEXT || '@example.invalid', 'traveler',
  repeat('d', 64), owner_id, now() + interval '1 day'
FROM member_cleanup_ids;

DO $$
DECLARE v_ids RECORD; v_result JSONB; v_member_row_id TEXT;
BEGIN
  SELECT * INTO v_ids FROM member_cleanup_ids;
  SELECT public.accept_trip_invitation(repeat('d', 64), v_ids.member_id) INTO v_result;
  IF v_result->>'status' <> 'accepted' OR (
    SELECT count(*) FROM public.trip_members
    WHERE trip_uuid = v_ids.trip_id
      AND lower(email) = lower(v_ids.member_id::TEXT || '@example.invalid')
  ) <> 1 THEN
    RAISE EXCEPTION 'Acceptatie liet een dubbele reisgenoot staan';
  END IF;
  SELECT public.decline_trip_invitation(repeat('e', 64), v_ids.declined_id) INTO v_result;
  IF v_result->>'status' <> 'declined' THEN
    RAISE EXCEPTION 'Weigeren leverde geen geldige respons op';
  END IF;
  IF (
    SELECT count(*) FROM public.notifications
    WHERE user_id = v_ids.owner_id
      AND event_key LIKE 'invitation-response:%'
  ) <> 2 THEN
    RAISE EXCEPTION 'Uitnodiger kreeg niet voor beide antwoorden een melding';
  END IF;

  SELECT id INTO v_member_row_id FROM public.trip_members
  WHERE trip_uuid = v_ids.trip_id AND user_id = v_ids.member_id;
  IF NOT public.remove_trip_member(v_ids.trip_id, v_member_row_id, v_ids.owner_id) THEN
    RAISE EXCEPTION 'Eigenaar kon het gekoppelde lid niet verwijderen';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_uuid = v_ids.trip_id AND user_id = v_ids.member_id
  ) THEN
    RAISE EXCEPTION 'Gekoppeld lid bleef na verwijderen bestaan';
  END IF;

  BEGIN
    PERFORM public.remove_trip_member(v_ids.trip_id, 'owner', v_ids.member_id);
    RAISE EXCEPTION 'Niet-eigenaar kon een lid verwijderen';
  EXCEPTION WHEN SQLSTATE 'PT403' THEN NULL;
  END;
END;
$$;

ROLLBACK;
