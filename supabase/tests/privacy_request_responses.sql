-- Uitvoeren na 20260908110000_privacy_request_responses.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='privacy_requests' AND column_name='response_text') THEN RAISE EXCEPTION 'PRIVACY_RESPONSE_COLUMN_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.privacy-response') THEN RAISE EXCEPTION 'PRIVACY_RESPONSE_ACCEPTANCE_MISSING'; END IF;
END $$;
