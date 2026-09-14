-- Uitvoeren na 20260908089000_trip_duplicate_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.duplicate') THEN
   RAISE EXCEPTION 'TRIP_DUPLICATE_ACCEPTANCE_ITEM_MISSING';
 END IF;
END $$;
