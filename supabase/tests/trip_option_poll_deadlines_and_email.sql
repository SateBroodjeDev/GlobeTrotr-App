-- Uitvoeren na 20260908154000_trip_option_poll_deadlines_and_email.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid =
    'public.run_trip_option_poll_reminders(timestamp with time zone)'::regprocedure) THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_REMINDER_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='queue_trip_option_poll_email'
    AND tgrelid='public.notifications'::regclass AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_EMAIL_TRIGGER_MISSING';
  END IF;
  IF has_function_privilege('authenticated',
    'public.run_trip_option_poll_reminders(timestamp with time zone)','EXECUTE') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_REMINDER_PUBLIC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.option-poll-delivery') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_DELIVERY_ACCEPTANCE_MISSING';
  END IF;
END $$;
