-- Uitvoeren na 20260908107000_worker_claim_recovery.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE wcr AS SELECT gen_random_uuid() user_id,gen_random_uuid() message_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT user_id,'claim-recovery@example.invalid',now() FROM wcr;
UPDATE public.email_delivery_config SET mode='live' WHERE id=true;
INSERT INTO public.email_outbox(id,notification_id,user_id,recipient_email,locale,template_key,payload,status,attempts,claimed_at)
SELECT message_id,NULL,user_id,'claim-recovery@example.invalid','nl','platform','{}','processing',1,now()-interval '11 minutes' FROM wcr;
DO $$ DECLARE v_id UUID;v_attempts INTEGER;BEGIN
 SELECT id,attempts INTO v_id,v_attempts FROM public.claim_email_outbox(1);
 IF v_id<>(SELECT message_id FROM wcr) OR v_attempts<>2 THEN RAISE EXCEPTION 'STALE_EMAIL_CLAIM_NOT_RECOVERED'; END IF;
 IF has_function_privilege('authenticated','public.claim_email_outbox(integer)','EXECUTE') THEN RAISE EXCEPTION 'AUTHENTICATED_CAN_CLAIM_EMAIL'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='worker.claim-recovery') THEN RAISE EXCEPTION 'WORKER_RECOVERY_ACCEPTANCE_MISSING'; END IF;
END $$;
ROLLBACK;
