-- Uitvoeren na 20260908158000_trip_booking_mail.sql. Alleen-lezen.
DO $$ BEGIN
 IF(SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN('trip_booking_mail_addresses','trip_booking_mail_drafts'))<>2 THEN RAISE EXCEPTION 'TRIP_BOOKING_MAIL_TABLES_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='trip_booking_mail_pending_idx')THEN RAISE EXCEPTION 'TRIP_BOOKING_MAIL_INDEX_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.booking-mail')THEN RAISE EXCEPTION 'TRIP_BOOKING_MAIL_ACCEPTANCE_MISSING';END IF;
END $$;
