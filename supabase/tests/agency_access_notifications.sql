-- Uitvoeren na 20260908049000_agency_access_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE aan AS SELECT gen_random_uuid() owner_id,gen_random_uuid() advisor_id,gen_random_uuid() finance_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'owner-access@example.invalid',now()FROM aan UNION ALL SELECT advisor_id,'advisor-access@example.invalid',now()FROM aan UNION ALL SELECT finance_id,'finance-access@example.invalid',now()FROM aan;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency',jsonb_build_object('branding',jsonb_build_object('brandName','Test Agency'))FROM aan;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at)SELECT workspace_id,advisor_id,'advisor','active',now()FROM aan UNION ALL SELECT workspace_id,finance_id,'finance','active',now()FROM aan;
DO $$ DECLARE v_all JSONB:='{"trips_view":true,"trips_create":true,"trips_plan":true,"expenses_manage":true,"trip_settings_manage":true,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB;BEGIN
 IF NOT public.save_agency_role_permissions((SELECT owner_id FROM aan),'advisor',v_all) THEN RAISE EXCEPTION 'Rolrechten niet opgeslagen';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT advisor_id FROM aan) AND kind='agency_access' AND event_key LIKE 'agency-role-permissions:%') OR EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT finance_id FROM aan) AND event_key LIKE 'agency-role-permissions:%') THEN RAISE EXCEPTION 'Rolrechtenmelding heeft onjuiste ontvangers';END IF;
 IF NOT public.save_agency_member_permissions((SELECT owner_id FROM aan),(SELECT finance_id FROM aan),'{"trips_plan":true}'::JSONB) THEN RAISE EXCEPTION 'Persoonlijke rechten niet opgeslagen';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT finance_id FROM aan) AND body LIKE 'member_permissions|%') THEN RAISE EXCEPTION 'Persoonlijke rechtenmelding ontbreekt';END IF;
 PERFORM public.manage_workspace_member((SELECT advisor_id FROM aan),(SELECT owner_id FROM aan),'role','finance');
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT advisor_id FROM aan) AND body='role|Test Agency|finance') THEN RAISE EXCEPTION 'Rolwijzigingsmelding ontbreekt';END IF;
END $$;
ROLLBACK;
