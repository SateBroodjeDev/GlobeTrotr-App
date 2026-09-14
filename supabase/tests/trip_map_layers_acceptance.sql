-- Uitvoeren na 20260908094000_trip_map_layers_acceptance.sql. Alleen-lezen.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.map-layers') THEN RAISE EXCEPTION 'TRIP_MAP_LAYERS_ACCEPTANCE_MISSING'; END IF; END $$;
