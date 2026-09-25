-- Uitvoeren na 20260908178000_trip_checklists.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='trip_tasks'
   AND column_name IN('category','list_name'))<>2 THEN
   RAISE EXCEPTION 'TRIP_CHECKLIST_COLUMNS_MISSING';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public'
   AND indexname='trip_tasks_trip_category_order_idx') THEN
   RAISE EXCEPTION 'TRIP_CHECKLIST_INDEX_MISSING';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items
   WHERE item_key='trip.general-checklists') THEN
   RAISE EXCEPTION 'TRIP_CHECKLIST_ACCEPTANCE_MISSING';
 END IF;
END $$;
