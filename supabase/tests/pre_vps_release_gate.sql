-- Uitvoeren na alle migraties tot en met 20260908096000. Alleen-lezen.
DO $$
DECLARE v_missing TEXT;
BEGIN
  SELECT string_agg(expected.item_key, ', ' ORDER BY expected.item_key) INTO v_missing
  FROM (VALUES
    ('trip.insights'),('public.navigation'),('public.about'),('public.maintenance'),
    ('trip.duplicate'),('trip.route-tools'),('trip.comparison'),('trip.tasks'),
    ('trip.today'),('trip.map-layers'),('trip.cover'),('release.pre-vps')
  ) AS expected(item_key)
  WHERE NOT EXISTS(SELECT 1 FROM public.release_checklist_items item WHERE item.item_key=expected.item_key);
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'PRE_VPS_CHECKLIST_MISSING: %',v_missing; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='trip_tasks' AND c.relrowsecurity) THEN RAISE EXCEPTION 'TRIP_TASKS_RLS_MISSING'; END IF;
  IF has_table_privilege('anon','public.trip_tasks','SELECT') OR has_table_privilege('authenticated','public.trip_tasks','SELECT') THEN RAISE EXCEPTION 'TRIP_TASKS_BROWSER_GRANT_UNSAFE'; END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='trip-covers' AND NOT public AND file_size_limit=5242880) THEN RAISE EXCEPTION 'TRIP_COVER_BUCKET_UNSAFE'; END IF;
END;
$$;
