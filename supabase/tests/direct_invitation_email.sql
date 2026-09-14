-- Uitvoeren na 20260908101000_direct_invitation_email.sql. Alleen-lezen.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_outbox' AND column_name IN('notification_id','user_id') AND is_nullable<>'YES') THEN RAISE EXCEPTION 'DIRECT_INVITATION_OUTBOX_NOT_NULL'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('mail.trip-invitation','mail.agency-invitation','deployment.independent-runtime','deployment.brand-library'))<>4 THEN RAISE EXCEPTION 'DIRECT_INVITATION_ACCEPTANCE_MISSING'; END IF;
END $$;
