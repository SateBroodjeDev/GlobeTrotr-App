-- Uitvoeren na 20260908150000_trip_comparer_category_fields.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_travel_options'
      AND column_name = 'details' AND data_type = 'jsonb'
  ) THEN RAISE EXCEPTION 'TRIP_COMPARER_DETAILS_MISSING'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'trip.options-comparison'
      AND label_nl LIKE '%Reisvergelijker%'
      AND label_en LIKE '%exactly one booking%'
  ) THEN RAISE EXCEPTION 'TRIP_COMPARER_ACCEPTANCE_MISSING'; END IF;
END $$;
