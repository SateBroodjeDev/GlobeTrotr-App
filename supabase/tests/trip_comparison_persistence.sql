-- Uitvoeren na 20260908166000_trip_comparison_persistence.sql. Alleen-lezen.
DO $$ BEGIN
 IF position('trip_travel_options' IN pg_get_functiondef('public.save_trip_snapshot_with_options_as(uuid,uuid,jsonb)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'TRIP_COMPARISON_PERSISTENCE_MISSING';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.comparison-persistence') THEN
   RAISE EXCEPTION 'TRIP_COMPARISON_ACCEPTANCE_MISSING';
 END IF;
END $$;
