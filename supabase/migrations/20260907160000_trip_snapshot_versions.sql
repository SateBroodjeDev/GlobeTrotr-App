-- Uitvoeren na 20260907150000_fix_snapshot_column_ambiguity.sql.
BEGIN;

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION private.bump_trip_revision()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.revision := OLD.revision + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trips_bump_revision BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION private.bump_trip_revision();

CREATE OR REPLACE FUNCTION public.save_trip_snapshot_versioned(
  p_workspace_user_id UUID, p_trip JSONB
)
RETURNS TABLE(trip_uuid UUID, revision TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID := (p_trip->>'id')::UUID;
  v_revision BIGINT;
BEGIN
  SELECT t.revision INTO v_revision FROM public.trips t
  WHERE t.trip_uuid = v_id AND t.workspace_user_id = p_workspace_user_id
  FOR UPDATE;
  IF NOT FOUND OR p_trip->>'revision' IS NULL
    OR p_trip->>'revision' <> v_revision::TEXT THEN
    RAISE EXCEPTION USING ERRCODE = 'PT409', MESSAGE = 'TRIP_VERSION_CONFLICT';
  END IF;

  -- The existing atomic writer runs under the same parent lock and transaction.
  PERFORM * FROM public.save_trip_snapshot(p_workspace_user_id, p_trip);
  -- Keep the compatibility snapshot on the acknowledged revision as well.
  UPDATE public.workspaces w SET data = jsonb_set(w.data, '{trips}', (
    SELECT jsonb_agg(CASE WHEN item->>'id' = v_id::TEXT
      THEN jsonb_set(item, '{revision}', to_jsonb((v_revision + 1)::TEXT)) ELSE item END ORDER BY position)
    FROM jsonb_array_elements(w.data->'trips') WITH ORDINALITY AS snapshot(item, position)
  )) WHERE w.user_id = p_workspace_user_id;
  RETURN QUERY SELECT t.trip_uuid, t.revision::TEXT FROM public.trips t WHERE t.trip_uuid = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_trip_snapshot_versioned(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot_versioned(UUID, JSONB) TO service_role;
-- Old deployments must fail closed rather than overwrite without a version.
REVOKE EXECUTE ON FUNCTION public.save_trip_snapshot(UUID, JSONB) FROM service_role;

CREATE OR REPLACE FUNCTION public.delete_trip_versioned(
  p_workspace_user_id UUID, p_trip_id UUID, p_revision TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_legacy_id TEXT;
BEGIN
  SELECT t.id INTO v_legacy_id FROM public.trips t
  WHERE t.trip_uuid = p_trip_id AND t.workspace_user_id = p_workspace_user_id
    AND t.revision::TEXT = p_revision FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'PT409', MESSAGE = 'TRIP_VERSION_CONFLICT';
  END IF;
  DELETE FROM public.trips t WHERE t.trip_uuid = p_trip_id;
  UPDATE public.workspaces w SET data = jsonb_set(w.data, '{trips}', (
    SELECT COALESCE(jsonb_agg(item ORDER BY position), '[]'::JSONB)
    FROM jsonb_array_elements(COALESCE(w.data->'trips', '[]'::JSONB))
      WITH ORDINALITY AS snapshot(item, position)
    WHERE item->>'id' NOT IN (p_trip_id::TEXT, v_legacy_id)
  )) WHERE w.user_id = p_workspace_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_trip_versioned(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_trip_versioned(UUID, UUID, TEXT) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
