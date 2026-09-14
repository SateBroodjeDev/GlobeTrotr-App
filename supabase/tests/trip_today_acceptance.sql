-- Uitvoeren na 20260908093000_trip_today_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.today') THEN RAISE EXCEPTION 'TRIP_TODAY_ACCEPTANCE_MISSING'; END IF;
END $$;
