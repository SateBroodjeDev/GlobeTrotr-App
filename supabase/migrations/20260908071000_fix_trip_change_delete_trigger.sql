-- Laat de algemene reismelding veilig omgaan met kindtabellen en DELETE.
-- Uitvoeren na 20260908070000_corporate_staff_management.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.notify_trip_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trip UUID;
  v_owner UUID;
  v_actor UUID;
  v_name TEXT;
  v_actor_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE'
    AND (to_jsonb(NEW) - 'updated_at') IS NOT DISTINCT FROM
        (to_jsonb(OLD) - 'updated_at') THEN
    RETURN NULL;
  END IF;

  -- Deze tabellen hebben een gerichte melding of veroorzaken uitsluitend
  -- interne snapshotwijzigingen.
  IF TG_TABLE_NAME IN (
    'trip_stops', 'trip_travel_items', 'trip_expenses', 'trip_documents'
  ) THEN
    RETURN NULL;
  END IF;

  -- Alleen de trigger op public.trips beschikt over deze kolommen. De aparte
  -- tak voorkomt dat PostgreSQL NEW.start_date probeert op te lossen voor een
  -- kindtabel of voor een DELETE-event.
  IF TG_TABLE_NAME = 'trips' THEN
    IF TG_OP <> 'UPDATE' THEN
      RETURN NULL;
    END IF;
    IF ROW(
      NEW.start_date, NEW.end_date, NEW.is_public,
      NEW.share_pin_hash, NEW.share_financials
    ) IS DISTINCT FROM ROW(
      OLD.start_date, OLD.end_date, OLD.is_public,
      OLD.share_pin_hash, OLD.share_financials
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_trip := OLD.trip_uuid;
  ELSE
    v_trip := NEW.trip_uuid;
  END IF;

  SELECT trip.workspace_user_id, trip.name
  INTO v_owner, v_name
  FROM public.trips AS trip
  WHERE trip.trip_uuid = v_trip;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_actor := private.current_trip_actor(v_owner);
  SELECT COALESCE(NULLIF(profile.display_name, ''), 'Een reisgenoot')
  INTO v_actor_name
  FROM public.profiles AS profile
  WHERE profile.id = v_actor;

  INSERT INTO public.notifications(
    user_id, kind, title, body, trip_uuid, event_key
  )
  SELECT DISTINCT
    member.user_id,
    'trip_change',
    'Reis bijgewerkt',
    COALESCE(v_actor_name, 'Een reisgenoot') || ' heeft ' || v_name || ' gewijzigd.',
    v_trip,
    'trip:' || v_trip::TEXT
  FROM public.trip_members AS member
  WHERE member.trip_uuid = v_trip
    AND member.status = 'active'
    AND member.user_id IS NOT NULL
    AND member.user_id <> v_actor
  ON CONFLICT (user_id, event_key) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    trip_uuid = EXCLUDED.trip_uuid,
    created_at = now(),
    dismissed_at = NULL;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_trip_change() FROM PUBLIC, anon, authenticated;

COMMIT;

