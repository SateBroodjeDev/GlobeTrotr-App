-- Uitvoeren na 20260908013000_public_trip_bookings.sql.
-- Controleert expliciete publicatie en de veilige veldselectie voor boekingen.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE public_booking_test_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS trip_id,
  gen_random_uuid() AS public_token;
GRANT SELECT ON public_booking_test_ids TO anon;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM public_booking_test_ids;
INSERT INTO public.workspaces(user_id, public_token, share_enabled, data)
SELECT owner_id, public_token, true, jsonb_build_object('trips', '[]'::JSONB)
FROM public_booking_test_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name, start_date, end_date, is_public)
SELECT owner_id, trip_id::TEXT, trip_id, 'Publieke boekingstest', current_date,
  current_date + 2, true FROM public_booking_test_ids;

INSERT INTO public.trip_travel_items(
  workspace_user_id, trip_id, trip_uuid, id, item_type, title, start_date,
  provider, booking_reference, flight_number, departure, arrival, amount,
  currency, notes, details
)
SELECT owner_id, trip_id::TEXT, trip_id, 'public-flight', 'flight',
  'Vlucht naar testbestemming', current_date, 'Geheime maatschappij',
  'GEHEIME-BOEKING', 'SECRET123',
  '{"name":"Amsterdam","country":"Nederland","lat":52.3,"lon":4.7}'::JSONB,
  '{"name":"Lissabon","country":"Portugal","lat":38.7,"lon":-9.1}'::JSONB,
  999, 'EUR', 'PRIVE-NOTITIE',
  '{"sharePublicly":true,"startTime":"10:15","flightDepartureGate":"SECRET-GATE"}'::JSONB
FROM public_booking_test_ids
UNION ALL
SELECT owner_id, trip_id::TEXT, trip_id, 'private-hotel', 'lodging',
  'PRIVE-HOTEL', current_date, 'Privéhotel', 'HOTEL-SECRET', NULL,
  NULL, NULL, 500, 'EUR', 'NIET-DELEN', '{"sharePublicly":false}'::JSONB
FROM public_booking_test_ids;

SET LOCAL ROLE anon;
DO $$
DECLARE v_result JSONB;
BEGIN
  SELECT public.get_public_trip(
    (SELECT public_token::TEXT FROM public_booking_test_ids),
    (SELECT trip_id::TEXT FROM public_booking_test_ids),
    NULL
  ) INTO v_result;

  IF v_result->>'status' <> 'ok'
    OR jsonb_array_length(v_result->'trip'->'travelItems') <> 1
    OR v_result->'trip'->'travelItems'->0->>'title' <> 'Vlucht naar testbestemming' THEN
    RAISE EXCEPTION 'Expliciet gedeelde boeking ontbreekt of private boeking is gelekt';
  END IF;
  IF v_result::TEXT LIKE '%GEHEIME-BOEKING%'
    OR v_result::TEXT LIKE '%SECRET123%'
    OR v_result::TEXT LIKE '%SECRET-GATE%'
    OR v_result::TEXT LIKE '%PRIVE-NOTITIE%'
    OR v_result::TEXT LIKE '%PRIVE-HOTEL%'
    OR v_result->'trip'->'travelItems'->0 ? 'amount' THEN
    RAISE EXCEPTION 'Publieke boekingssamenvatting lekt private velden';
  END IF;
  IF v_result->'trip'->'travelItems'->0->'departure' ? 'lat' THEN
    RAISE EXCEPTION 'Publieke boekingslocatie lekt precieze coördinaten';
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
