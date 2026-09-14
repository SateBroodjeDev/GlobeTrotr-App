-- Uitvoeren na 20260908050000_agency_branding_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE abn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() manager_id,gen_random_uuid() viewer_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'brand-owner@example.invalid',now()FROM abn UNION ALL SELECT manager_id,'brand-manager@example.invalid',now()FROM abn UNION ALL SELECT viewer_id,'brand-viewer@example.invalid',now()FROM abn;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM abn;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)SELECT workspace_id,manager_id,'advisor','active',now(),'{"branding_manage":true}'::JSONB FROM abn UNION ALL SELECT workspace_id,viewer_id,'advisor','active',now(),'{"branding_manage":false}'::JSONB FROM abn;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Merktest'FROM abn;
DO $$ DECLARE v_owner UUID;v_manager UUID;v_workspace UUID;v_trip UUID;BEGIN
 SELECT owner_id,manager_id,workspace_id,trip_id INTO v_owner,v_manager,v_workspace,v_trip FROM abn;
 PERFORM public.get_agency_settings(v_owner);
 UPDATE public.agency_settings SET tagline='Nieuwe tagline',updated_by=v_manager WHERE workspace_uuid=v_workspace;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND body LIKE 'branding|%') OR EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT viewer_id FROM abn) AND body LIKE 'branding|%') THEN RAISE EXCEPTION 'Organisatiemerkmelding heeft onjuiste ontvangers';END IF;
 INSERT INTO public.trip_branding_overrides(trip_uuid,enabled,brand_name,updated_by)VALUES(v_trip,true,'Reismerk',v_owner);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_manager AND body LIKE 'trip_branding|%|Merktest') THEN RAISE EXCEPTION 'Reisbrandingmelding ontbreekt';END IF;
END $$;
ROLLBACK;
