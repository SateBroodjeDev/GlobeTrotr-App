-- Uitvoeren na 20260908167000_live_calendar_refresh.sql. Alleen-lezen.
DO $$ BEGIN
 IF pg_get_functiondef('public.get_trip_calendar_feed(text)'::regprocedure) NOT LIKE '%updated_at%' THEN
  RAISE EXCEPTION 'LIVE_CALENDAR_UPDATED_AT_MISSING';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.calendar-feed'
   AND label_nl LIKE '%hele-dagactiviteit%' AND label_en LIKE '%automatic refresh%') THEN
  RAISE EXCEPTION 'LIVE_CALENDAR_REFRESH_ACCEPTANCE_MISSING';
 END IF;
END $$;
