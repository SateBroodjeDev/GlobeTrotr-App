-- Uitvoeren na 20260908116000_paddle_billing_runtime.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE v_owner UUID:=gen_random_uuid();v_workspace UUID:=gen_random_uuid();v_result TEXT;
BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(v_owner,'paddle@example.invalid',now());
 INSERT INTO public.workspaces(user_id,workspace_uuid,data) VALUES(v_owner,v_workspace,'{"plan":"free"}');
 SELECT public.process_paddle_billing_event(jsonb_build_object(
  'event_id','evt_globetrotr_test','event_type','subscription.created','occurred_at',now(),
  'data',jsonb_build_object('id','sub_globetrotr_test','customer_id','ctm_globetrotr_test',
   'status','active','currency_code','EUR','billing_cycle',jsonb_build_object('interval','month'),
   'globetrotr_plan','pro','custom_data',jsonb_build_object('workspace_uuid',v_workspace)))) INTO v_result;
 IF v_result<>'processed' OR (SELECT plan FROM public.workspaces WHERE workspace_uuid=v_workspace)<>'pro' THEN RAISE EXCEPTION 'PADDLE_SUBSCRIPTION_NOT_APPLIED'; END IF;
 IF public.process_paddle_billing_event(jsonb_build_object('event_id','evt_globetrotr_test','event_type','subscription.created','data','{}'::jsonb))<>'duplicate' THEN RAISE EXCEPTION 'PADDLE_EVENT_NOT_IDEMPOTENT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.email_outbox WHERE template_key='billing' AND payload->>'actionUrl'='https://globetrotr.nl/billing') THEN RAISE EXCEPTION 'PADDLE_EMAIL_NOT_QUEUED'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('billing.paddle-checkout','billing.paddle-webhooks','billing.paddle-portal','billing.transactional-email','billing.refunds','billing.plan-change'))<>6 THEN RAISE EXCEPTION 'PADDLE_CHECKLIST_MISSING'; END IF;
END $$;
ROLLBACK;
