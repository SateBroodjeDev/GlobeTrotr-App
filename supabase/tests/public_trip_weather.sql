-- Uitvoeren na 20260908014000_public_trip_weather.sql.
-- Controleert dat alleen Pro en Agency publiek weer beschikbaar maken zonder de plannaam te lekken.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE public_weather_test_ids AS
SELECT gen_random_uuid() AS pro_owner_id, gen_random_uuid() AS free_owner_id,
  gen_random_uuid() AS pro_trip_id, gen_random_uuid() AS free_trip_id,
  gen_random_uuid() AS pro_token, gen_random_uuid() AS free_token;
GRANT SELECT ON public_weather_test_ids TO anon;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT pro_owner_id, pro_owner_id::TEXT || '@example.invalid', now()
FROM public_weather_test_ids
UNION ALL
SELECT free_owner_id, free_owner_id::TEXT || '@example.invalid', now()
FROM public_weather_test_ids;

INSERT INTO public.workspaces(user_id, public_token, share_enabled, plan, data)
SELECT pro_owner_id, pro_token, true, 'pro', '{"trips":[]}'::JSONB
FROM public_weather_test_ids
UNION ALL
SELECT free_owner_id, free_token, true, 'free', '{"trips":[]}'::JSONB
FROM public_weather_test_ids;

INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, start_date, end_date, is_public)
SELECT pro_owner_id, pro_trip_id::TEXT, pro_trip_id, 'Pro-weerreis', current_date,
  current_date + 1, true FROM public_weather_test_ids
UNION ALL
SELECT free_owner_id, free_trip_id::TEXT, free_trip_id, 'Free-weerreis', current_date,
  current_date + 1, true FROM public_weather_test_ids;

SET LOCAL ROLE anon;
DO $$
DECLARE v_pro JSONB; v_free JSONB;
BEGIN
  SELECT public.get_public_trip(
    (SELECT pro_token::TEXT FROM public_weather_test_ids),
    (SELECT pro_trip_id::TEXT FROM public_weather_test_ids), NULL
  ) INTO v_pro;
  SELECT public.get_public_trip(
    (SELECT free_token::TEXT FROM public_weather_test_ids),
    (SELECT free_trip_id::TEXT FROM public_weather_test_ids), NULL
  ) INTO v_free;

  IF (v_pro->'trip'->>'weatherEnabled')::BOOLEAN IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Pro-reis stelt publiek weer niet beschikbaar';
  END IF;
  IF (v_free->'trip'->>'weatherEnabled')::BOOLEAN IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Free-reis stelt publiek weer ten onrechte beschikbaar';
  END IF;
  IF v_pro->'trip' ? 'plan' OR v_free->'trip' ? 'plan' THEN
    RAISE EXCEPTION 'Publieke reis lekt de plannaam';
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
