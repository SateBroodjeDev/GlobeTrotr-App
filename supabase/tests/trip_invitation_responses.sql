-- Uitvoeren na 20260908020000_trip_invitation_responses.sql.
-- Controleert accepteren, weigeren, e-mailbinding en idempotentie.
BEGIN;

CREATE TEMP TABLE invitation_test_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS accepted_id,
  gen_random_uuid() AS declined_id, gen_random_uuid() AS trip_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM invitation_test_ids
UNION ALL SELECT accepted_id, accepted_id::TEXT || '@example.invalid', now() FROM invitation_test_ids
UNION ALL SELECT declined_id, declined_id::TEXT || '@example.invalid', now() FROM invitation_test_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM invitation_test_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Uitnodigingstest' FROM invitation_test_ids;

INSERT INTO public.trip_invitations(trip_uuid, email, role, token_hash, invited_by, expires_at)
SELECT trip_id, accepted_id::TEXT || '@example.invalid', 'traveler', repeat('a', 64), owner_id, now() + interval '1 day' FROM invitation_test_ids
UNION ALL SELECT trip_id, declined_id::TEXT || '@example.invalid', 'viewer', repeat('b', 64), owner_id, now() + interval '1 day' FROM invitation_test_ids;

INSERT INTO public.trip_invitations(trip_uuid, email, role, token_hash, invited_by, expires_at)
SELECT trip_id, owner_id::TEXT || '@example.invalid', 'traveler', repeat('c', 64), owner_id,
  now() + interval '1 day' FROM invitation_test_ids;

DO $$
DECLARE v_ids RECORD; v_result JSONB;
BEGIN
  SELECT * INTO v_ids FROM invitation_test_ids;
  SELECT public.accept_trip_invitation(repeat('a', 64), v_ids.declined_id) INTO v_result;
  IF v_result->>'status' <> 'forbidden' THEN RAISE EXCEPTION 'Een ander account kon de uitnodiging accepteren'; END IF;

  SELECT public.accept_trip_invitation(repeat('a', 64), v_ids.accepted_id) INTO v_result;
  IF v_result->>'status' <> 'accepted' OR NOT EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_uuid = v_ids.trip_id
      AND user_id = v_ids.accepted_id AND role = 'traveler' AND status = 'active'
  ) THEN RAISE EXCEPTION 'Acceptatie maakte geen actief lidmaatschap'; END IF;
  SELECT public.accept_trip_invitation(repeat('a', 64), v_ids.accepted_id) INTO v_result;
  IF v_result->>'status' <> 'accepted' THEN RAISE EXCEPTION 'Herhaalde acceptatie is niet idempotent'; END IF;

  SELECT public.decline_trip_invitation(repeat('b', 64), v_ids.declined_id) INTO v_result;
  IF v_result->>'status' <> 'declined' OR EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_uuid = v_ids.trip_id AND user_id = v_ids.declined_id
  ) THEN RAISE EXCEPTION 'Weigeren verleende toegang of kreeg verkeerde status'; END IF;
  SELECT public.decline_trip_invitation(repeat('b', 64), v_ids.declined_id) INTO v_result;
  IF v_result->>'status' <> 'invalid' THEN
    RAISE EXCEPTION 'De oorspronkelijke link bleef geldig na weigeren';
  END IF;

  SELECT public.accept_trip_invitation(repeat('c', 64), v_ids.owner_id) INTO v_result;
  IF v_result->>'status' <> 'already_member' OR NOT EXISTS (
    SELECT 1 FROM public.trip_members WHERE trip_uuid = v_ids.trip_id
      AND user_id = v_ids.owner_id AND role = 'owner' AND status = 'active'
  ) THEN RAISE EXCEPTION 'Bestaand actief lidmaatschap werd niet veilig hergebruikt'; END IF;
END;
$$;

ROLLBACK;
