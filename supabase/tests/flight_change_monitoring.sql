-- Uitvoeren na 20260908162000_flight_change_monitoring.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flight_monitor_state')THEN RAISE EXCEPTION 'FLIGHT_MONITOR_TABLE_MISSING';END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('claim_due_flight_monitors','record_flight_monitor_result'))<>2 THEN RAISE EXCEPTION 'FLIGHT_MONITOR_FUNCTIONS_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='notifications.flight-monitoring')THEN RAISE EXCEPTION 'FLIGHT_MONITOR_ACCEPTANCE_MISSING';END IF;
END $$;
