-- Herstel naamconflicten tussen uitvoervariabelen en tabelkolommen.
-- Behoud de atomaire opslag en bestaande uitvoerrechten.
BEGIN;

CREATE OR REPLACE FUNCTION public.save_trip_snapshot(
  p_workspace_user_id UUID,
  p_trip JSONB
)
RETURNS TABLE(trip_uuid UUID, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip_uuid UUID;
  v_legacy_trip_id TEXT;
  v_updated_at TIMESTAMPTZ;
  v_workspace_data JSONB;
  v_current_trips JSONB;
  v_next_trips JSONB;
  v_snapshot JSONB;
  v_replaced BOOLEAN := false;
BEGIN
  IF p_workspace_user_id IS NULL OR jsonb_typeof(p_trip) <> 'object' THEN
    RAISE EXCEPTION 'Ongeldige reisopslag.';
  END IF;

  BEGIN
    v_trip_uuid := NULLIF(p_trip->>'id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'De reis heeft geen geldige, onveranderlijke ID.';
  END;

  IF v_trip_uuid IS NULL THEN
    RAISE EXCEPTION 'De reis heeft geen geldige, onveranderlijke ID.';
  END IF;

  -- Lock de parent-rij. Hierdoor kunnen twee volledige snapshots niet door
  -- elkaar heen kindrijen verwijderen of opnieuw toevoegen.
  SELECT id INTO v_legacy_trip_id
  FROM public.trips AS saved_trip
  WHERE workspace_user_id = p_workspace_user_id
    AND saved_trip.trip_uuid = v_trip_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    v_legacy_trip_id := v_trip_uuid::TEXT;
    INSERT INTO public.trips AS saved_trip (
      workspace_user_id, id, trip_uuid, name, template, start_date, end_date,
      budget, travelers, archived, is_public, share_financials, share_pin_hash
    ) VALUES (
      p_workspace_user_id,
      v_legacy_trip_id,
      v_trip_uuid,
      NULLIF(btrim(COALESCE(p_trip->>'name', '')), ''),
      COALESCE(NULLIF(p_trip->>'template', ''), 'citytrip'),
      NULLIF(p_trip->>'start', '')::DATE,
      NULLIF(p_trip->>'end', '')::DATE,
      COALESCE(NULLIF(p_trip->>'budget', '')::NUMERIC, 0),
      CASE WHEN jsonb_typeof(p_trip->'travelers') = 'array' THEN p_trip->'travelers' ELSE '[]'::JSONB END,
      COALESCE(NULLIF(p_trip->>'archived', '')::BOOLEAN, false),
      COALESCE(NULLIF(p_trip->>'public', '')::BOOLEAN, false),
      COALESCE(NULLIF(p_trip->>'shareFinancials', '')::BOOLEAN, false),
      NULLIF(p_trip->>'sharePinHash', '')
    )
    RETURNING saved_trip.updated_at INTO v_updated_at;
  ELSE
    UPDATE public.trips AS saved_trip
    SET
      name = NULLIF(btrim(COALESCE(p_trip->>'name', '')), ''),
      template = COALESCE(NULLIF(p_trip->>'template', ''), 'citytrip'),
      start_date = NULLIF(p_trip->>'start', '')::DATE,
      end_date = NULLIF(p_trip->>'end', '')::DATE,
      budget = COALESCE(NULLIF(p_trip->>'budget', '')::NUMERIC, 0),
      travelers = CASE WHEN jsonb_typeof(p_trip->'travelers') = 'array' THEN p_trip->'travelers' ELSE '[]'::JSONB END,
      archived = COALESCE(NULLIF(p_trip->>'archived', '')::BOOLEAN, false),
      is_public = COALESCE(NULLIF(p_trip->>'public', '')::BOOLEAN, false),
      share_financials = COALESCE(NULLIF(p_trip->>'shareFinancials', '')::BOOLEAN, false),
      share_pin_hash = NULLIF(p_trip->>'sharePinHash', '')
    WHERE workspace_user_id = p_workspace_user_id
      AND saved_trip.trip_uuid = v_trip_uuid
    RETURNING saved_trip.updated_at INTO v_updated_at;
  END IF;

  DELETE FROM public.trip_stops AS child WHERE child.trip_uuid = v_trip_uuid;
  INSERT INTO public.trip_stops (
    workspace_user_id, trip_id, trip_uuid, id, position, name, country, lat, lon, arrive_date, nights
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', item.ordinality - 1,
    COALESCE(NULLIF(item.value->>'name', ''), 'Onbekende locatie'),
    COALESCE(item.value->>'country', ''),
    COALESCE(NULLIF(item.value->>'lat', '')::DOUBLE PRECISION, 0),
    COALESCE(NULLIF(item.value->>'lon', '')::DOUBLE PRECISION, 0),
    NULLIF(item.value->>'arrive', '')::DATE,
    NULLIF(item.value->>'nights', '')::INTEGER
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'stops') = 'array' THEN p_trip->'stops' ELSE '[]'::JSONB END
  ) WITH ORDINALITY AS item(value, ordinality)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL;

  DELETE FROM public.trip_itinerary_items AS child WHERE child.trip_uuid = v_trip_uuid;
  INSERT INTO public.trip_itinerary_items (
    workspace_user_id, trip_id, trip_uuid, id, day, title, notes, source_travel_item_id, position
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', NULLIF(item.value->>'day', '')::DATE,
    COALESCE(NULLIF(item.value->>'title', ''), 'Onderdeel'),
    NULLIF(item.value->>'notes', ''),
    NULLIF(item.value->>'sourceTravelItemId', ''), item.ordinality - 1
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'itinerary') = 'array' THEN p_trip->'itinerary' ELSE '[]'::JSONB END
  ) WITH ORDINALITY AS item(value, ordinality)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL
    AND NULLIF(item.value->>'day', '') IS NOT NULL;

  DELETE FROM public.trip_expenses AS child WHERE child.trip_uuid = v_trip_uuid;
  INSERT INTO public.trip_expenses (
    workspace_user_id, trip_id, trip_uuid, id, expense_date, title, category,
    amount, currency, paid_by, billable, split_with, receipt_path, receipt_name, notes
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', NULLIF(item.value->>'date', '')::DATE,
    COALESCE(NULLIF(item.value->>'title', ''), 'Uitgave'),
    COALESCE(NULLIF(item.value->>'category', ''), 'other'),
    COALESCE(NULLIF(item.value->>'amount', '')::NUMERIC, 0),
    COALESCE(NULLIF(item.value->>'currency', ''), 'EUR'),
    COALESCE(item.value->>'paidBy', ''),
    COALESCE(NULLIF(item.value->>'billable', '')::BOOLEAN, false),
    CASE WHEN jsonb_typeof(item.value->'splitWith') = 'array' THEN item.value->'splitWith' ELSE '[]'::JSONB END,
    NULLIF(item.value->>'receiptPath', ''), NULLIF(item.value->>'receiptName', ''),
    NULLIF(item.value->>'notes', '')
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'expenses') = 'array' THEN p_trip->'expenses' ELSE '[]'::JSONB END
  ) AS item(value)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL
    AND NULLIF(item.value->>'date', '') IS NOT NULL;

  DELETE FROM public.trip_travel_items AS child WHERE child.trip_uuid = v_trip_uuid;
  INSERT INTO public.trip_travel_items (
    workspace_user_id, trip_id, trip_uuid, id, item_type, title, start_date, end_date,
    provider, booking_reference, flight_number, flight_status, departure, arrival,
    location, amount, currency, expense_id, notes, details
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', COALESCE(NULLIF(item.value->>'type', ''), 'activity'),
    COALESCE(NULLIF(item.value->>'title', ''), 'Reisonderdeel'),
    NULLIF(item.value->>'date', '')::DATE, NULLIF(item.value->>'endDate', '')::DATE,
    NULLIF(item.value->>'provider', ''), NULLIF(item.value->>'bookingReference', ''),
    NULLIF(item.value->>'flightNumber', ''), NULLIF(item.value->>'flightStatus', ''),
    item.value->'departure', item.value->'arrival', item.value->'location',
    NULLIF(item.value->>'amount', '')::NUMERIC, NULLIF(item.value->>'currency', ''),
    NULLIF(item.value->>'expenseId', ''), NULLIF(item.value->>'notes', ''),
    CASE WHEN jsonb_typeof(item.value->'details') = 'object' THEN item.value->'details' ELSE '{}'::JSONB END
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'travelItems') = 'array' THEN p_trip->'travelItems' ELSE '[]'::JSONB END
  ) AS item(value)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL
    AND NULLIF(item.value->>'date', '') IS NOT NULL;

  DELETE FROM public.trip_packing_items AS child WHERE child.trip_uuid = v_trip_uuid;
  INSERT INTO public.trip_packing_items (
    workspace_user_id, trip_id, trip_uuid, id, label, done, position
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', COALESCE(NULLIF(item.value->>'label', ''), 'Paklijstitem'),
    COALESCE(NULLIF(item.value->>'done', '')::BOOLEAN, false), item.ordinality - 1
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'packing') = 'array' THEN p_trip->'packing' ELSE '[]'::JSONB END
  ) WITH ORDINALITY AS item(value, ordinality)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL;

  -- Actieve reisleden met een echt account zijn niet onderdeel van de oude
  -- JSON-vorm en worden daarom nooit door een browser-snapshot verwijderd.
  DELETE FROM public.trip_members AS child WHERE child.trip_uuid = v_trip_uuid
    AND role <> 'owner'
    AND user_id IS NULL;

  INSERT INTO public.trip_members (
    workspace_user_id, trip_id, trip_uuid, id, user_id, name, email, role,
    status, invited_at, accepted_at
  )
  SELECT
    p_workspace_user_id, v_legacy_trip_id, v_trip_uuid,
    item.value->>'id', NULL,
    COALESCE(NULLIF(item.value->>'name', ''), 'Reisgenoot'),
    COALESCE(NULLIF(item.value->>'email', ''), 'unknown@example.invalid'),
    item.value->>'role',
    COALESCE(NULLIF(item.value->>'status', ''), 'invited'),
    COALESCE(NULLIF(item.value->>'invitedAt', '')::TIMESTAMPTZ, now()), NULL
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_trip->'members') = 'array' THEN p_trip->'members' ELSE '[]'::JSONB END
  ) AS item(value)
  WHERE NULLIF(item.value->>'id', '') IS NOT NULL
    AND item.value->>'role' IN ('traveler', 'viewer', 'advisor', 'finance', 'client')
  ON CONFLICT (workspace_user_id, trip_id, id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    invited_at = EXCLUDED.invited_at
  -- Een geaccepteerd account is relationele toegangsdata, geen JSON-draft.
  -- Laat die koppeling en accepted_at daarom altijd ongemoeid.
  WHERE public.trip_members.user_id IS NULL;

  -- Houd de tijdelijke JSON-kopie in exact dezelfde transactie bij. Dit is
  -- alleen een overgangsback-up; SQL blijft de runtimebron voor reisdelen.
  SELECT data INTO v_workspace_data
  FROM public.workspaces
  WHERE user_id = p_workspace_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace niet gevonden.';
  END IF;

  v_current_trips := CASE
    WHEN jsonb_typeof(v_workspace_data->'trips') = 'array' THEN v_workspace_data->'trips'
    ELSE '[]'::JSONB
  END;
  v_snapshot := jsonb_set(p_trip, '{id}', to_jsonb(v_trip_uuid::TEXT), true);

  SELECT
    COALESCE(
      jsonb_agg(
        CASE
          WHEN item.value->>'id' IN (v_trip_uuid::TEXT, v_legacy_trip_id) THEN v_snapshot
          ELSE item.value
        END
        ORDER BY item.ordinality
      ),
      '[]'::JSONB
    ),
    COALESCE(bool_or(item.value->>'id' IN (v_trip_uuid::TEXT, v_legacy_trip_id)), false)
  INTO v_next_trips, v_replaced
  FROM jsonb_array_elements(v_current_trips) WITH ORDINALITY AS item(value, ordinality);

  IF NOT v_replaced THEN
    v_next_trips := v_next_trips || jsonb_build_array(v_snapshot);
  END IF;

  UPDATE public.workspaces
  SET data = jsonb_set(v_workspace_data, '{trips}', v_next_trips, true)
  WHERE user_id = p_workspace_user_id;

  RETURN QUERY SELECT v_trip_uuid, v_updated_at;
END;
$$;

-- Alleen de server met de service-role mag deze functie aanroepen. De app
-- bepaalt de eigenaar via requireSupabaseAuth voordat hij de serverfunctie
-- bereikt; de browser kan deze SQL-functie niet rechtstreeks misbruiken.
REVOKE ALL ON FUNCTION public.save_trip_snapshot(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_trip_snapshot(UUID, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.save_trip_snapshot(UUID, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot(UUID, JSONB) TO service_role;

-- Laat PostgREST de nieuwe RPC direct zien wanneer dit via de SQL Editor
-- wordt uitgevoerd.
NOTIFY pgrst, 'reload schema';

COMMIT;
