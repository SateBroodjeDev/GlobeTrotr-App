-- Uitvoeren na 20260908149000_trip_options_comparison.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='trip_travel_options'
  ) THEN
    RAISE EXCEPTION 'TRIP_OPTIONS_TABLE_MISSING';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
      AND tablename='trip_travel_options'
      AND policyname IN ('Members read travel options','Planners manage travel options')) <> 2 THEN
    RAISE EXCEPTION 'TRIP_OPTIONS_POLICIES_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.options-comparison'
      AND label_nl LIKE '%maximaal vier%'
      AND label_en LIKE '%exactly one booking%'
  ) THEN
    RAISE EXCEPTION 'TRIP_OPTIONS_COMPARISON_ACCEPTANCE_MISSING';
  END IF;
END $$;
