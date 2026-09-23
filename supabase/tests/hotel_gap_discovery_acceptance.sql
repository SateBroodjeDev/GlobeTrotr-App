-- Uitvoeren na 20260908165000_hotel_gap_discovery_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.hotel-gap-discovery') THEN RAISE EXCEPTION 'HOTEL_GAP_DISCOVERY_ACCEPTANCE_MISSING'; END IF;
END $$;
