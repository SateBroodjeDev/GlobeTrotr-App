-- Uitvoeren na 20260908106000_mail_delivery_mode_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.email_delivery_config WHERE id AND mode IN('test','live')) THEN RAISE EXCEPTION 'MAIL_DELIVERY_MODE_CONFIG_MISSING'; END IF;
 IF has_function_privilege('authenticated','public.set_email_delivery_mode(text,boolean,uuid)','EXECUTE') THEN RAISE EXCEPTION 'AUTHENTICATED_CAN_CHANGE_MAIL_MODE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='mail.delivery-mode') THEN RAISE EXCEPTION 'MAIL_DELIVERY_MODE_ACCEPTANCE_MISSING'; END IF;
END $$;
