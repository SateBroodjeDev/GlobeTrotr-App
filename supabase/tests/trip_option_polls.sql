-- Uitvoeren na 20260908152000_trip_option_polls.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='trip_option_polls')
    OR NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='trip_option_votes') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_TABLES_MISSING';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('trip_option_polls','trip_option_votes')) <> 7 THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_POLICIES_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
    AND indexname='trip_option_one_open_poll_idx') THEN
    RAISE EXCEPTION 'TRIP_OPTION_ONE_OPEN_POLL_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.option-decisions') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_ACCEPTANCE_MISSING';
  END IF;
END $$;
