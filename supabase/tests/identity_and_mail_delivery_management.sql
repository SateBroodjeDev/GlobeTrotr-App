-- Uitvoeren na 20260908105000_identity_and_mail_delivery_management.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE imdm AS SELECT gen_random_uuid() user_id,gen_random_uuid() invitation_id;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
SELECT user_id,'oauth-profile@example.invalid',now(),'{"global_name":"OAuth Reiziger"}'::jsonb FROM imdm;
INSERT INTO public.email_outbox(notification_id,user_id,recipient_email,locale,template_key,payload,status,invitation_type,invitation_id)
SELECT NULL,user_id,'oauth-profile@example.invalid','nl','invitation','{}','failed','trip',invitation_id FROM imdm;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE display_name='OAuth Reiziger' AND email='oauth-profile@example.invalid') THEN RAISE EXCEPTION 'OAUTH_PROFILE_NOT_NORMALIZED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.email_outbox WHERE invitation_type='trip' AND invitation_id IS NOT NULL) THEN RAISE EXCEPTION 'INVITATION_DELIVERY_LINK_MISSING'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('auth.identity-management','auth.oauth-profile-normalization','mail.delivery-management','mail.invitation-status'))<>4 THEN RAISE EXCEPTION 'IDENTITY_MAIL_ACCEPTANCE_MISSING'; END IF;
END $$;
ROLLBACK;
