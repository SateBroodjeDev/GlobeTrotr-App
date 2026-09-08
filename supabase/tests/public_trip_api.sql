-- Uitvoeren na 20260908010000_public_trip_api.sql.
-- Controleert dat alleen veilige openbare reisvelden via anon beschikbaar zijn.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE public_trip_api_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS trip_id,
  gen_random_uuid() AS pinned_trip_id, gen_random_uuid() AS public_token;
GRANT SELECT ON public_trip_api_ids TO anon;

INSERT INTO auth.users(id, email, email_confirmed_at, raw_user_meta_data)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now(), '{"full_name":"Openbare tester"}'::JSONB
FROM public_trip_api_ids;
INSERT INTO public.workspaces(user_id, public_token, share_enabled, data)
SELECT owner_id, public_token, true, jsonb_build_object('privateMarker', 'MAG_NIET_LEKKEN')
FROM public_trip_api_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, start_date, end_date, is_public)
SELECT owner_id, trip_id::TEXT, trip_id, 'Openbare reis', current_date, current_date + 2, true
FROM public_trip_api_ids
UNION ALL
SELECT owner_id, pinned_trip_id::TEXT, pinned_trip_id, 'PIN-reis', current_date, current_date + 2, true
FROM public_trip_api_ids;
UPDATE public.trips SET share_pin_hash = 'correct-hash'
WHERE trip_uuid = (SELECT pinned_trip_id FROM public_trip_api_ids);
INSERT INTO public.trip_stops(workspace_user_id, trip_id, trip_uuid, id, position, name, country, lat, lon)
SELECT owner_id, trip_id::TEXT, trip_id, 'stop-1', 0, 'Utrecht', 'Nederland', 52.09, 5.12
FROM public_trip_api_ids;

SET LOCAL ROLE anon;
DO $$
DECLARE
  v_cards JSONB;
  v_detail JSONB;
BEGIN
  SELECT public.list_public_trip_cards() INTO v_cards;
  IF (
    SELECT count(*) FROM jsonb_array_elements(v_cards) AS card
    WHERE card->>'tripId' = (SELECT trip_id::TEXT FROM public_trip_api_ids)
      AND card->>'name' = 'Openbare reis'
  ) <> 1 THEN
    RAISE EXCEPTION 'Openbare lijst bevat de verwachte reis zonder PIN niet';
  END IF;
  IF v_cards::TEXT LIKE '%MAG_NIET_LEKKEN%' OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_cards) AS card
    WHERE card->>'tripId' = (SELECT trip_id::TEXT FROM public_trip_api_ids)
      AND card ? 'budget'
  ) THEN
    RAISE EXCEPTION 'Openbare lijst lekt private workspace- of financiële data';
  END IF;

  SELECT public.get_public_trip(
    (SELECT public_token::TEXT FROM public_trip_api_ids),
    (SELECT pinned_trip_id::TEXT FROM public_trip_api_ids),
    'verkeerd'
  ) INTO v_detail;
  IF v_detail->>'status' <> 'pin_required' THEN
    RAISE EXCEPTION 'PIN-reis accepteert een onjuiste hash';
  END IF;

  SELECT public.get_public_trip(
    (SELECT public_token::TEXT FROM public_trip_api_ids),
    (SELECT pinned_trip_id::TEXT FROM public_trip_api_ids),
    'correct-hash'
  ) INTO v_detail;
  IF v_detail->>'status' <> 'ok' OR v_detail->'trip' ? 'share_pin_hash' THEN
    RAISE EXCEPTION 'PIN-reis wordt niet veilig vrijgegeven';
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
