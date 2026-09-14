-- Uitvoeren na 20260908084000_feedback_conversations_and_admin_alerts.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE fca AS SELECT gen_random_uuid() user_id,gen_random_uuid() admin_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT user_id,'feedback-user@example.invalid',now() FROM fca UNION ALL SELECT admin_id,'feedback-admin@example.invalid',now() FROM fca;
INSERT INTO public.platform_admins(user_id,role,permissions,active,created_by) SELECT admin_id,'owner','{}'::JSONB,true,admin_id FROM fca;
INSERT INTO public.beta_feedback(user_id,title,description,page_url,category) SELECT user_id,'Testfeedback','Een voldoende lange omschrijving voor de regressietest.','/test','bug' FROM fca;
DO $$ DECLARE v_feedback UUID;v_user UUID;v_admin UUID;BEGIN
 SELECT id INTO v_feedback FROM public.beta_feedback WHERE title='Testfeedback'; SELECT user_id,admin_id INTO v_user,v_admin FROM fca;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_admin AND event_key='admin-feedback:'||v_feedback::TEXT) THEN RAISE EXCEPTION 'ADMIN_FEEDBACK_ALERT_MISSING'; END IF;
 INSERT INTO public.feedback_replies(feedback_id,author_user_id,body) VALUES(v_feedback,v_admin,'Kun je aangeven welke browser je gebruikt?');
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_user AND event_key='feedback-reply:'||v_feedback::TEXT) THEN RAISE EXCEPTION 'FEEDBACK_REPLY_ALERT_MISSING'; END IF;
END $$;
ROLLBACK;
