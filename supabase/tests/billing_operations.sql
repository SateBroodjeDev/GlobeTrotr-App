-- Uitvoeren na 20260908069000_billing_operations.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ DECLARE v_owner UUID:=gen_random_uuid();v_workspace UUID:=gen_random_uuid();v_customer UUID;v_subscription UUID;BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at)VALUES(v_owner,'billing-owner@example.invalid',now());
 INSERT INTO public.workspaces(user_id,workspace_uuid,data)VALUES(v_owner,v_workspace,'{}');
 INSERT INTO public.billing_customers(workspace_uuid,provider_customer_id,billing_email)VALUES(v_workspace,'ctm_test','billing@example.invalid')RETURNING id INTO v_customer;
 INSERT INTO public.billing_subscriptions(customer_id,provider_subscription_id,plan,status,currency,recurring_total_minor,billing_interval)VALUES(v_customer,'sub_test','pro','active','EUR',900,'month')RETURNING id INTO v_subscription;
 INSERT INTO public.billing_transactions(customer_id,subscription_id,provider_transaction_id,status,currency,subtotal_minor,tax_minor,total_minor,occurred_at)VALUES(v_customer,v_subscription,'txn_test','completed','EUR',900,189,1089,now());
 INSERT INTO public.billing_webhook_events(provider_event_id,event_type,occurred_at,payload)VALUES('evt_test','transaction.completed',now(),'{}');
 IF has_table_privilege('authenticated','public.billing_transactions','SELECT') OR has_function_privilege('authenticated','public.claim_billing_webhooks(integer)','EXECUTE') THEN RAISE EXCEPTION 'Browserrol heeft toegang tot betaaladministratie';END IF;
 IF(SELECT count(*) FROM public.claim_billing_webhooks(10))<>1 THEN RAISE EXCEPTION 'Webhookclaim ontbreekt';END IF;
END $$;
ROLLBACK;
