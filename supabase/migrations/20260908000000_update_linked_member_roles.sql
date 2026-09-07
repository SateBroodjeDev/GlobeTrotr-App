-- Laat een eigenaar de rol wijzigen van een reisgenoot die al aan een Auth-account is gekoppeld.
-- Behoud daarbij user_id, status en accepted_at. Uitvoeren na 20260907170000_trip_description.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.save_trip_snapshot_versioned(
  p_workspace_user_id UUID, p_trip JSONB
)
RETURNS TABLE(trip_uuid UUID, revision TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID := (p_trip->>'id')::UUID;
  v_revision BIGINT;
  v_new_revision BIGINT;
BEGIN
  SELECT t.revision INTO v_revision FROM public.trips t
  WHERE t.trip_uuid = v_id AND t.workspace_user_id = p_workspace_user_id
  FOR UPDATE;
  IF NOT FOUND OR p_trip->>'revision' IS NULL
    OR p_trip->>'revision' <> v_revision::TEXT THEN
    RAISE EXCEPTION USING ERRCODE = 'PT409', MESSAGE = 'TRIP_VERSION_CONFLICT';
  END IF;

  PERFORM * FROM public.save_trip_snapshot(p_workspace_user_id, p_trip);

  -- save_trip_snapshot bewaart gekoppelde accounts bewust. Synchroniseer hier
  -- uitsluitend hun rol vanuit de door de eigenaar ingestuurde snapshot. De
  -- bestaande accountkoppeling en acceptatiegegevens blijven zo behouden.
  UPDATE public.trip_members AS saved_member
  SET role = submitted_member.value->>'role'
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p_trip->'members') = 'array' THEN p_trip->'members'
      ELSE '[]'::JSONB
    END
  ) AS submitted_member(value)
  WHERE saved_member.trip_uuid = v_id
    AND saved_member.workspace_user_id = p_workspace_user_id
    AND saved_member.id = submitted_member.value->>'id'
    AND saved_member.user_id IS NOT NULL
    AND saved_member.role <> 'owner'
    AND submitted_member.value->>'role' IN ('traveler', 'viewer', 'advisor', 'finance', 'client')
    AND saved_member.role IS DISTINCT FROM submitted_member.value->>'role';

  UPDATE public.trips t
  SET description = NULLIF(btrim(COALESCE(p_trip->>'description', '')), '')
  WHERE t.trip_uuid = v_id
    AND t.workspace_user_id = p_workspace_user_id
    AND t.description IS DISTINCT FROM NULLIF(btrim(COALESCE(p_trip->>'description', '')), '');

  SELECT t.revision INTO v_new_revision FROM public.trips t WHERE t.trip_uuid = v_id;
  UPDATE public.workspaces w SET data = jsonb_set(w.data, '{trips}', (
    SELECT jsonb_agg(CASE WHEN item->>'id' = v_id::TEXT
      THEN jsonb_set(item, '{revision}', to_jsonb(v_new_revision::TEXT)) ELSE item END ORDER BY position)
    FROM jsonb_array_elements(w.data->'trips') WITH ORDINALITY AS snapshot(item, position)
  )) WHERE w.user_id = p_workspace_user_id;
  RETURN QUERY SELECT v_id, v_new_revision::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.save_trip_snapshot_versioned(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot_versioned(UUID, JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
