-- Uitvoeren na 20260908114000_notification_and_invitation_reliability.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='email_outbox_invitation_delivery_once_idx') THEN RAISE EXCEPTION 'INVITATION_DELIVERY_UNIQUE_INDEX_MISSING'; END IF;
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN RAISE EXCEPTION 'NOTIFICATIONS_REALTIME_MISSING'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('notifications.realtime','mail.invitation-once','account.mfa-recovery','account.identity-linking','trip.export-actions'))<>5 THEN RAISE EXCEPTION 'RELIABILITY_ACCEPTANCE_ITEMS_MISSING'; END IF;
END $$;
