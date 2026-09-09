-- Uitvoeren na 20260908029000_manage_pending_trip_invitations.sql.
-- Controleert vernieuwen, intrekken en eigenaarautorisatie. Alles wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE invitation_management_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS other_id,
  gen_random_uuid() AS invitee_id, gen_random_uuid() AS trip_id,
  gen_random_uuid() AS invitation_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM invitation_management_ids
UNION ALL SELECT other_id, other_id::TEXT || '@example.invalid', now() FROM invitation_management_ids
UNION ALL SELECT invitee_id, 'invitee@example.invalid', now() FROM invitation_management_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM invitation_management_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Uitnodigingsbeheer' FROM invitation_management_ids;
INSERT INTO public.trip_members(workspace_user_id, trip_id, trip_uuid, id, name, email, role, status)
SELECT owner_id, trip_id::TEXT, trip_id, 'pending-member', 'Genodigde',
  'invitee@example.invalid', 'traveler', 'invited' FROM invitation_management_ids;
INSERT INTO public.trip_invitations(
  id, trip_uuid, email, role, token_hash, invited_by, created_at, expires_at
)
SELECT invitation_id, trip_id, 'invitee@example.invalid', 'traveler', repeat('a', 64),
  owner_id, now() - interval '8 days', now() - interval '1 day'
FROM invitation_management_ids;

DO $$
DECLARE v JSONB;
BEGIN
  SELECT public.manage_trip_invitation(invitation_id, trip_id, other_id, 'renew', repeat('b', 64))
    INTO v FROM invitation_management_ids;
  IF v->>'status' <> 'forbidden' THEN RAISE EXCEPTION 'Niet-eigenaar kon uitnodiging beheren'; END IF;

  SELECT public.manage_trip_invitation(invitation_id, trip_id, owner_id, 'renew', repeat('b', 64))
    INTO v FROM invitation_management_ids;
  IF v->>'status' <> 'renewed' THEN RAISE EXCEPTION 'Vernieuwen mislukt'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trip_invitations WHERE token_hash = repeat('b', 64) AND expires_at > now()) THEN
    RAISE EXCEPTION 'Token of verloopdatum is niet vernieuwd';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE event_key = 'invitation:' || (SELECT invitation_id FROM invitation_management_ids) AND dismissed_at IS NULL) THEN
    RAISE EXCEPTION 'Vernieuwen heeft geen actieve accountmelding';
  END IF;

  SELECT public.manage_trip_invitation(invitation_id, trip_id, owner_id, 'revoke', NULL)
    INTO v FROM invitation_management_ids;
  IF v->>'status' <> 'revoked' THEN RAISE EXCEPTION 'Intrekken mislukt'; END IF;
  IF EXISTS (SELECT 1 FROM public.trip_members WHERE id = 'pending-member') THEN
    RAISE EXCEPTION 'Placeholder bleef na intrekken bestaan';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE event_key = 'invitation:' || (SELECT invitation_id FROM invitation_management_ids) AND dismissed_at IS NULL) THEN
    RAISE EXCEPTION 'Accountmelding bleef na intrekken open';
  END IF;
END;
$$;

ROLLBACK;
