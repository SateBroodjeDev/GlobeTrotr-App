-- Uitvoeren na 20260908033000_agency_permission_overrides.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_permission_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() advisor_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'rights-owner@example.invalid',now() FROM agency_permission_ids UNION ALL SELECT advisor_id,'rights-advisor@example.invalid',now() FROM agency_permission_ids UNION ALL SELECT outsider_id,'rights-outsider@example.invalid',now() FROM agency_permission_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_permission_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at) SELECT workspace_id,advisor_id,'advisor','active',now() FROM agency_permission_ids;
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions) SELECT workspace_id,'advisor','{"trips_view":true,"trips_create":true,"trips_plan":true,"expenses_manage":true,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB FROM agency_permission_ids ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions;
DO $$ DECLARE ids agency_permission_ids%ROWTYPE; complete JSONB; BEGIN
 SELECT * INTO ids FROM agency_permission_ids; complete:='{"trips_view":true,"trips_create":false,"trips_plan":true,"expenses_manage":false,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB;
 IF NOT public.save_agency_role_permissions(ids.owner_id,'advisor',complete) THEN RAISE EXCEPTION 'Rolrechten niet opgeslagen'; END IF;
 IF NOT public.save_agency_member_permissions(ids.owner_id,ids.advisor_id,'{"expenses_manage":true,"trips_create":true}'::JSONB) THEN RAISE EXCEPTION 'Gebruikersafwijkingen niet opgeslagen'; END IF;
 IF (SELECT permission_overrides->>'expenses_manage' FROM public.workspace_members WHERE user_id=ids.advisor_id)<>'true' THEN RAISE EXCEPTION 'Gebruikersafwijking ontbreekt'; END IF;
 IF public.save_agency_role_permissions(ids.outsider_id,'advisor',complete) THEN RAISE EXCEPTION 'Buitenstaander wijzigde rolrechten'; END IF;
 IF public.save_agency_member_permissions(ids.owner_id,ids.owner_id,'{"trips_view":false}'::JSONB) THEN RAISE EXCEPTION 'Eigenaarsrechten konden worden beperkt'; END IF;
END $$;
ROLLBACK;
