-- Geef openbare reispagina's alleen expliciet geselecteerde velden via RPC.
-- De serverfunctie kan hierdoor met de publishable key werken en heeft voor
-- publieke reads geen service-role secret nodig.
BEGIN;

DROP POLICY IF EXISTS "Shared workspaces are publicly readable" ON public.workspaces;
REVOKE SELECT ON public.workspaces FROM anon;

CREATE OR REPLACE FUNCTION public.list_public_trip_cards()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_agg(card ORDER BY start_date NULLS LAST, trip_id), '[]'::JSONB)
  FROM (
    SELECT
      trip.start_date,
      trip.trip_uuid::TEXT AS trip_id,
      jsonb_build_object(
        'token', workspace.public_token,
        'tripId', trip.trip_uuid::TEXT,
        'name', trip.name,
        'description', trip.description,
        'template', trip.template,
        'start', COALESCE(trip.start_date::TEXT, ''),
        'end', COALESCE(trip.end_date::TEXT, ''),
        'authorName', COALESCE(NULLIF(btrim(profile.display_name), ''), 'Een GlobeTrotr-reiziger'),
        'stops', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'name', stop.name,
            'country', stop.country,
            'lat', stop.lat,
            'lon', stop.lon,
            'arrive', stop.arrive_date,
            'nights', stop.nights
          ) ORDER BY stop.position)
          FROM public.trip_stops AS stop
          WHERE stop.trip_uuid = trip.trip_uuid
        ), '[]'::JSONB)
      ) AS card
    FROM public.trips AS trip
    JOIN public.workspaces AS workspace ON workspace.user_id = trip.workspace_user_id
    LEFT JOIN public.profiles AS profile ON profile.id = trip.workspace_user_id
    WHERE trip.is_public = true
      AND trip.archived = false
      AND trip.share_pin_hash IS NULL
    ORDER BY trip.start_date NULLS LAST, trip.trip_uuid
    LIMIT 60
  ) AS public_cards;
$$;

CREATE OR REPLACE FUNCTION public.get_public_trip(
  p_token TEXT,
  p_trip_id TEXT,
  p_pin_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip public.trips%ROWTYPE;
  v_token TEXT;
  v_author TEXT;
  v_result JSONB;
BEGIN
  SELECT trip.*
  INTO v_trip
  FROM public.trips AS trip
  JOIN public.workspaces AS workspace ON workspace.user_id = trip.workspace_user_id
  WHERE workspace.public_token::TEXT = p_token
    AND (trip.trip_uuid::TEXT = p_trip_id OR trip.id = p_trip_id)
    AND trip.is_public = true
    AND trip.archived = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT workspace.public_token,
    COALESCE(NULLIF(btrim(profile.display_name), ''), 'Een GlobeTrotr-reiziger')
  INTO v_token, v_author
  FROM public.workspaces AS workspace
  LEFT JOIN public.profiles AS profile ON profile.id = workspace.user_id
  WHERE workspace.user_id = v_trip.workspace_user_id;

  IF v_trip.share_pin_hash IS NOT NULL
    AND v_trip.share_pin_hash IS DISTINCT FROM COALESCE(p_pin_hash, '') THEN
    RETURN jsonb_build_object('status', 'pin_required');
  END IF;

  v_result := jsonb_build_object(
    'token', v_token,
    'tripId', v_trip.trip_uuid::TEXT,
    'name', v_trip.name,
    'description', v_trip.description,
    'template', v_trip.template,
    'start', COALESCE(v_trip.start_date::TEXT, ''),
    'end', COALESCE(v_trip.end_date::TEXT, ''),
    'authorName', v_author,
    'stops', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', stop.name, 'country', stop.country, 'lat', stop.lat, 'lon', stop.lon,
        'arrive', stop.arrive_date, 'nights', stop.nights
      ) ORDER BY stop.position)
      FROM public.trip_stops AS stop WHERE stop.trip_uuid = v_trip.trip_uuid
    ), '[]'::JSONB),
    'itinerary', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', item.day, 'title', item.title, 'notes', item.notes
      ) ORDER BY item.day, item.position)
      FROM public.trip_itinerary_items AS item WHERE item.trip_uuid = v_trip.trip_uuid
    ), '[]'::JSONB)
  );
  IF v_trip.share_financials THEN
    v_result := v_result || jsonb_build_object('budget', v_trip.budget, 'currency', 'EUR');
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'trip', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.list_public_trip_cards() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_trip_cards() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
