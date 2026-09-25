-- Uitvoeren na 20260908180000_trip_journal.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_journal_entries') THEN RAISE EXCEPTION 'TRIP_JOURNAL_TABLE_MISSING';END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='trip_journal_entries')<>4 THEN RAISE EXCEPTION 'TRIP_JOURNAL_POLICIES_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='trip-journal' AND public=false) THEN RAISE EXCEPTION 'TRIP_JOURNAL_BUCKET_MISSING';END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND policyname IN('Trip viewers read journal photos','Trip planners upload journal photos','Trip planners delete journal photos'))<>3 THEN RAISE EXCEPTION 'TRIP_JOURNAL_STORAGE_POLICIES_MISSING';END IF;
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_journal_entries' AND column_name IN('location_name','rating','photo_paths','photo_captions'))<>4 THEN RAISE EXCEPTION 'TRIP_JOURNAL_EXPERIENCE_FIELDS_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.journal') THEN RAISE EXCEPTION 'TRIP_JOURNAL_ACCEPTANCE_MISSING';END IF;
END $$;
