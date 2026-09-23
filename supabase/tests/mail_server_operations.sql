-- Uitvoeren na 20260908157000_mail_server_operations.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_status_components WHERE component_key='mail_server')
   THEN RAISE EXCEPTION 'MAIL_SERVER_STATUS_COMPONENT_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.mail-server-operations')
   THEN RAISE EXCEPTION 'MAIL_SERVER_OPERATIONS_ACCEPTANCE_MISSING'; END IF;
END $$;
