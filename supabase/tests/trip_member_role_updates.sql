-- Uitvoeren na 20260908000000_update_linked_member_roles.sql.
-- Controleert dat een rolwijziging de bestaande Auth-koppeling behoudt.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE member_role_test_ids AS
SELECT gen_random_uuid() AS owner_id,
  gen_random_uuid() AS member_id,
  gen_random_uuid() AS trip_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now()
FROM member_role_test_ids
UNION ALL
SELECT member_id, member_id::TEXT || '@example.invalid', now()
FROM member_role_test_ids;

INSERT INTO public.workspaces(user_id, data)
SELECT owner_id, jsonb_build_object('trips', '[]'::JSONB)
FROM member_role_test_ids;

INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, start_date, end_date)
SELECT owner_id, trip_id::TEXT, trip_id, 'Rolwijzigingstest', current_date, current_date + 1
FROM member_role_test_ids;

INSERT INTO public.trip_members(
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
  role, status, invited_at, accepted_at
)
SELECT owner_id, trip_id::TEXT, trip_id, 'linked-member', member_id,
  'Gekoppeld lid', member_id::TEXT || '@example.invalid',
  'client', 'active', now() - interval '1 day', now() - interval '12 hours'
FROM member_role_test_ids;

DO $$
DECLARE
  v_owner_id UUID;
  v_member_id UUID;
  v_trip_id UUID;
  v_revision TEXT;
  v_accepted_at TIMESTAMPTZ;
  v_trip JSONB;
BEGIN
  SELECT owner_id, member_id, trip_id
  INTO v_owner_id, v_member_id, v_trip_id
  FROM member_role_test_ids;

  SELECT revision::TEXT INTO v_revision
  FROM public.trips
  WHERE trip_uuid = v_trip_id;

  SELECT accepted_at INTO v_accepted_at
  FROM public.trip_members
  WHERE trip_uuid = v_trip_id AND id = 'linked-member';

  v_trip := jsonb_build_object(
    'id', v_trip_id::TEXT,
    'revision', v_revision,
    'name', 'Rolwijzigingstest',
    'template', 'citytrip',
    'start', current_date::TEXT,
    'end', (current_date + 1)::TEXT,
    'budget', 0,
    'travelers', '[]'::JSONB,
    'archived', false,
    'public', false,
    'shareFinancials', false,
    'stops', '[]'::JSONB,
    'itinerary', '[]'::JSONB,
    'expenses', '[]'::JSONB,
    'travelItems', '[]'::JSONB,
    'packing', '[]'::JSONB,
    'members', jsonb_build_array(jsonb_build_object(
      'id', 'linked-member',
      'name', 'Gekoppeld lid',
      'email', v_member_id::TEXT || '@example.invalid',
      'role', 'finance',
      'status', 'active',
      'invitedAt', (now() - interval '1 day')::TEXT
    ))
  );

  PERFORM * FROM public.save_trip_snapshot_versioned(v_owner_id, v_trip);

  IF NOT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_uuid = v_trip_id
      AND id = 'linked-member'
      AND user_id = v_member_id
      AND role = 'finance'
      AND status = 'active'
      AND accepted_at = v_accepted_at
  ) THEN
    RAISE EXCEPTION 'Rolwijziging heeft de rol of bestaande accountkoppeling niet correct bewaard';
  END IF;
END;
$$;

ROLLBACK;
