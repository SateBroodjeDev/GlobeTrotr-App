-- Uitvoeren na 20260908068000_corporate_mail_workflow.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ DECLARE v_mailbox UUID;v_user UUID:=gen_random_uuid();BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(v_user,'mail-worker@example.invalid',now());
 SELECT id INTO v_mailbox FROM public.corporate_mailboxes WHERE address='info@globetrotr.nl';
 INSERT INTO public.corporate_mailbox_members(mailbox_id,user_id,permission) VALUES(v_mailbox,v_user,'reply');
 INSERT INTO public.corporate_mail_send_queue(mailbox_id,created_by,recipient_addresses,subject,body_text)
 VALUES(v_mailbox,v_user,ARRAY['customer@example.invalid'],'Testbericht','Veilige testinhoud');
 IF NOT EXISTS(SELECT 1 FROM public.corporate_mail_send_queue WHERE mailbox_id=v_mailbox AND status='held') THEN RAISE EXCEPTION 'Uitgaande mail werd niet veilig vastgehouden';END IF;
 IF has_table_privilege('authenticated','public.corporate_mail_send_queue','SELECT') OR has_function_privilege('authenticated','public.claim_corporate_mail_queue(integer)','EXECUTE') THEN RAISE EXCEPTION 'Browserrol heeft toegang tot mailwachtrij';END IF;
END $$;
ROLLBACK;
