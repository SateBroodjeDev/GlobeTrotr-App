-- Uitvoeren na 20260908117000_payment_modes_and_live_calendars.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('billing.one-time-month','auth.discord-linking','trip.calendar-feed','trip.gpx-download','corporate.mailbox-create','auth.registration-turnstile'))<>6 THEN RAISE EXCEPTION 'PAYMENT_AND_FEEDBACK_ACCEPTANCE_MISSING'; END IF;
 IF has_function_privilege('anon','public.get_trip_calendar_feed(text)','EXECUTE') THEN RAISE EXCEPTION 'CALENDAR_FEED_RPC_PUBLIC'; END IF;
END $$;
