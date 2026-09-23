-- Uitvoeren na 20260908151000_trip_option_comments.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trip_option_comments') THEN
    RAISE EXCEPTION 'TRIP_OPTION_COMMENTS_TABLE_MISSING';
  END IF;
  IF (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trip_option_comments') <> 3 THEN
    RAISE EXCEPTION 'TRIP_OPTION_COMMENTS_POLICIES_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.trip_option_comments'::regclass
      AND contype = 'f' AND confrelid = 'public.trip_travel_options'::regclass) THEN
    RAISE EXCEPTION 'TRIP_OPTION_COMMENTS_CASCADE_MISSING';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'trip_option_comments'
      AND grantee = 'authenticated' AND privilege_type = 'UPDATE') THEN
    RAISE EXCEPTION 'TRIP_OPTION_COMMENTS_UPDATE_NOT_ALLOWED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'trip.option-comments') THEN
    RAISE EXCEPTION 'TRIP_OPTION_COMMENTS_ACCEPTANCE_MISSING';
  END IF;
END $$;
