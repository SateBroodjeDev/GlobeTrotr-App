-- Voeg alleen expliciet gedeelde, veilige boekingssamenvattingen toe aan de publieke reis-RPC.
-- Boekingsreferenties, prijzen, notities, vluchtstatusdetails en financiële velden blijven privé.
-- Uitvoeren na 20260908010000_public_trip_api.sql.
BEGIN;

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
  SELECT trip.* INTO v_trip
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
    ), '[]'::JSONB),
    'travelItems', COALESCE((
      SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'type', item.item_type,
        'title', item.title,
        'date', item.start_date::TEXT,
        'endDate', item.end_date::TEXT,
        'startTime', NULLIF(item.details->>'startTime', ''),
        'endTime', NULLIF(item.details->>'endTime', ''),
        'transportMode', NULLIF(item.details->>'transportMode', ''),
        'departure', CASE WHEN jsonb_typeof(item.departure) = 'object' THEN
          jsonb_strip_nulls(jsonb_build_object(
            'name', NULLIF(item.departure->>'name', ''),
            'country', NULLIF(item.departure->>'country', '')
          )) END,
        'arrival', CASE WHEN jsonb_typeof(item.arrival) = 'object' THEN
          jsonb_strip_nulls(jsonb_build_object(
            'name', NULLIF(item.arrival->>'name', ''),
            'country', NULLIF(item.arrival->>'country', '')
          )) END,
        'location', CASE WHEN jsonb_typeof(item.location) = 'object' THEN
          jsonb_strip_nulls(jsonb_build_object(
            'name', NULLIF(item.location->>'name', ''),
            'country', NULLIF(item.location->>'country', '')
          )) END
      )) ORDER BY item.start_date, item.id)
      FROM public.trip_travel_items AS item
      WHERE item.trip_uuid = v_trip.trip_uuid
        AND item.details->>'sharePublicly' = 'true'
    ), '[]'::JSONB)
  );

  IF v_trip.share_financials THEN
    v_result := v_result || jsonb_build_object('budget', v_trip.budget, 'currency', 'EUR');
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'trip', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
