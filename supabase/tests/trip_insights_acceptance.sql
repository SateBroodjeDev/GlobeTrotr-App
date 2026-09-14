-- Uitvoeren na 20260908087000_trip_insights_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.insights') THEN
   RAISE EXCEPTION 'TRIP_INSIGHTS_ACCEPTANCE_ITEM_MISSING';
 END IF;
END $$;
