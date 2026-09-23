-- Uitvoeren na 20260908161000_web_push_delivery.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN('web_push_subscriptions','web_push_outbox'))<>2 THEN RAISE EXCEPTION 'WEB_PUSH_TABLES_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.notifications'::regclass AND tgname='queue_web_push_notification' AND NOT tgisinternal) THEN RAISE EXCEPTION 'WEB_PUSH_TRIGGER_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='notifications.web-push') THEN RAISE EXCEPTION 'WEB_PUSH_ACCEPTANCE_MISSING';END IF;
END $$;
