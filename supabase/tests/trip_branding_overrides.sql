-- Uitvoeren na 20260908034000_trip_branding_overrides.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE trip_branding_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() advisor_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'brand-owner@example.invalid',now() FROM trip_branding_ids UNION ALL SELECT advisor_id,'brand-advisor@example.invalid',now() FROM trip_branding_ids UNION ALL SELECT outsider_id,'brand-outsider@example.invalid',now() FROM trip_branding_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM trip_branding_ids;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name) SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Merkreis' FROM trip_branding_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides) SELECT workspace_id,advisor_id,'advisor','active',now(),'{"branding_manage":true}'::JSONB FROM trip_branding_ids;
DO $$ DECLARE ids trip_branding_ids%ROWTYPE; result JSONB; BEGIN
 SELECT * INTO ids FROM trip_branding_ids;
 IF NOT public.save_trip_branding(ids.advisor_id,ids.trip_id,'{"enabled":true,"brandName":"Klantreis","accent":210}'::JSONB) THEN RAISE EXCEPTION 'Toegestane reisbranding niet opgeslagen'; END IF;
 SELECT public.get_trip_branding(ids.advisor_id,ids.trip_id) INTO result;
 IF result->>'brandName'<>'Klantreis' OR result->>'enabled'<>'true' THEN RAISE EXCEPTION 'Reisbranding niet teruggelezen'; END IF;
 UPDATE public.trips SET is_public=true WHERE trip_uuid=ids.trip_id;
 UPDATE public.workspaces SET public_token=gen_random_uuid() WHERE workspace_uuid=ids.workspace_id;
 INSERT INTO public.agency_settings(workspace_uuid,system_name,sender_name,contact_email) VALUES(ids.workspace_id,'Agencymerk','Agencymerk','brand@example.invalid');
 SELECT public.get_public_trip_branding((SELECT public_token::TEXT FROM public.workspaces WHERE workspace_uuid=ids.workspace_id),ids.trip_id::TEXT) INTO result;
 IF result->>'brandName'<>'Klantreis' OR result ? 'logoPath' THEN RAISE EXCEPTION 'Publieke reisbranding onjuist of onveilig'; END IF;
 IF public.save_trip_branding(ids.outsider_id,ids.trip_id,'{"enabled":true}'::JSONB) THEN RAISE EXCEPTION 'Buitenstaander kon reisbranding wijzigen'; END IF;
END $$;
ROLLBACK;
