-- Uitvoeren na 20260908091000_trip_comparison_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.comparison') THEN
   RAISE EXCEPTION 'TRIP_COMPARISON_ACCEPTANCE_ITEM_MISSING';
 END IF;
END $$;
