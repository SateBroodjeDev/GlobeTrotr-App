-- Uitvoeren na 20260908156000_self_hosted_corporate_mail.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public'
   AND table_name='corporate_mailboxes' AND column_name IN
   ('hosting_mode','provisioning_status','provisioning_requested_at','provisioned_at','provisioning_error_code','mail_server_account_id'))<>6
   THEN RAISE EXCEPTION 'SELF_HOSTED_MAIL_COLUMNS_MISSING'; END IF;
 IF has_function_privilege('authenticated','public.claim_mailbox_provisioning(integer)','EXECUTE')
   OR has_function_privilege('anon','public.complete_mailbox_provisioning(uuid,boolean,text,text)','EXECUTE')
   THEN RAISE EXCEPTION 'MAIL_PROVISIONING_RPC_EXPOSED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.self-hosted-mail')
   THEN RAISE EXCEPTION 'SELF_HOSTED_MAIL_ACCEPTANCE_MISSING'; END IF;
END $$;
