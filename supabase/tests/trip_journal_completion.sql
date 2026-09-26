-- Uitvoeren na 20260908182000_trip_journal_completion.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_journal_entries' AND column_name='photo_sizes') THEN RAISE EXCEPTION 'TRIP_JOURNAL_PHOTO_SIZES_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_journal_summaries') THEN RAISE EXCEPTION 'TRIP_JOURNAL_SUMMARIES_MISSING'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='trip_journal_summaries')<>4 THEN RAISE EXCEPTION 'TRIP_JOURNAL_SUMMARY_POLICIES_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.journal-completion') THEN RAISE EXCEPTION 'TRIP_JOURNAL_COMPLETION_ACCEPTANCE_MISSING'; END IF;
END $$;
