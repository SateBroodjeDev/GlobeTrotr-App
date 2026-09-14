-- Uitvoeren na 20260908071000_fix_trip_change_delete_trigger.sql.
-- Controleert dat een volledige workspacecascade geen meldingsfout veroorzaakt.
BEGIN;

CREATE TEMP TABLE trip_delete_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS trip_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now()
FROM trip_delete_ids;

INSERT INTO public.workspaces(user_id, data)
SELECT owner_id, '{}'::JSONB FROM trip_delete_ids;

INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Verwijdertest'
FROM trip_delete_ids;

INSERT INTO public.trip_itinerary_items(
  workspace_user_id, trip_id, trip_uuid, id, position, day, title
)
SELECT owner_id, trip_id::TEXT, trip_id, 'delete-item', 0, current_date, 'Test'
FROM trip_delete_ids;

DELETE FROM public.workspaces
WHERE user_id = (SELECT owner_id FROM trip_delete_ids);
SET CONSTRAINTS ALL IMMEDIATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.trips
    WHERE trip_uuid = (SELECT trip_id FROM trip_delete_ids)
  ) THEN
    RAISE EXCEPTION 'Reis bleef na workspacecascade bestaan';
  END IF;
END;
$$;

ROLLBACK;
