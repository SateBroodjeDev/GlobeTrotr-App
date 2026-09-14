-- Uitvoeren na 20260908086000_calendar_export_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.calendar-export') THEN
   RAISE EXCEPTION 'CALENDAR_EXPORT_ACCEPTANCE_ITEM_MISSING';
 END IF;
END $$;
