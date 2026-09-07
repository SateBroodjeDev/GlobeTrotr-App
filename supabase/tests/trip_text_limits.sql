-- Uitvoeren na 20260908002000_trip_text_limits.sql.
-- Controleert de databasegrenzen voor reisnaam en reisomschrijving.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE trip_text_limit_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS trip_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now()
FROM trip_text_limit_ids;

INSERT INTO public.workspaces(user_id)
SELECT owner_id FROM trip_text_limit_ids;

INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, description)
SELECT owner_id, trip_id::TEXT, trip_id, repeat('n', 30), repeat('d', 375)
FROM trip_text_limit_ids;

DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM trip_text_limit_ids;

  BEGIN
    INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
    VALUES (v_owner_id, gen_random_uuid()::TEXT, gen_random_uuid(), repeat('n', 31));
    RAISE EXCEPTION 'Een reisnaam van 31 tekens werd ten onrechte geaccepteerd';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, description)
    VALUES (v_owner_id, gen_random_uuid()::TEXT, gen_random_uuid(), 'Reis', repeat('d', 376));
    RAISE EXCEPTION 'Een reisomschrijving van 376 tekens werd ten onrechte geaccepteerd';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;

ROLLBACK;
