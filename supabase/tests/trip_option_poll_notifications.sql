-- Uitvoeren na 20260908153000_trip_option_poll_notifications.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public'
    AND table_name='trip_option_poll_audit') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_AUDIT_MISSING';
  END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgname IN
    ('trip_option_poll_events','trip_option_vote_events') AND NOT tgisinternal) <> 2 THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_EVENT_TRIGGERS_MISSING';
  END IF;
  IF has_table_privilege('authenticated','public.trip_option_poll_audit','INSERT')
    OR has_table_privilege('authenticated','public.trip_option_poll_audit','UPDATE')
    OR has_table_privilege('authenticated','public.trip_option_poll_audit','DELETE') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_AUDIT_WRITABLE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.option-poll-notifications') THEN
    RAISE EXCEPTION 'TRIP_OPTION_POLL_NOTIFICATIONS_ACCEPTANCE_MISSING';
  END IF;
END $$;
