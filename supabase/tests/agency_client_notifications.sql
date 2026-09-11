-- Uitvoeren na 20260908053000_agency_client_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE acn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() manager_id,
 gen_random_uuid() muted_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at)
 SELECT owner_id,'client-notify-owner@example.invalid',now() FROM acn
 UNION ALL SELECT manager_id,'client-notify-manager@example.invalid',now() FROM acn
 UNION ALL SELECT muted_id,'client-notify-muted@example.invalid',now() FROM acn;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)
 SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM acn;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)
 SELECT workspace_id,manager_id,'advisor','active',now(),'{"members_manage":true}'::JSONB FROM acn
 UNION ALL SELECT workspace_id,muted_id,'advisor','active',now(),'{"members_manage":true}'::JSONB FROM acn;
INSERT INTO public.agency_notification_preferences(workspace_uuid,user_id,client_updates)
 SELECT workspace_id,muted_id,false FROM acn;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)
 SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Klantreis' FROM acn;

DO $$ DECLARE v_owner UUID;v_manager UUID;v_muted UUID;v_workspace UUID;v_trip UUID;v_client UUID;BEGIN
 SELECT owner_id,manager_id,muted_id,workspace_id,trip_id INTO v_owner,v_manager,v_muted,v_workspace,v_trip FROM acn;
 SELECT public.save_agency_client(v_manager,v_workspace,NULL,
  '{"fullName":"Meldingsklant","email":"client-notify@example.invalid","locale":"nl"}'::JSONB,ARRAY[v_trip]) INTO v_client;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND kind='agency_client' AND body='linked|Meldingsklant|Klantreis') THEN
  RAISE EXCEPTION 'Klantkoppeling werd niet aan de eigenaar gemeld';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id IN(v_manager,v_muted) AND kind='agency_client') THEN
  RAISE EXCEPTION 'Uitvoerder of gebruiker zonder klantupdates kreeg een melding';END IF;
 PERFORM public.set_agency_client_archived(v_manager,v_workspace,v_client,true);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND event_key='agency-client:'||v_client::TEXT AND body='archived|Meldingsklant|') THEN
  RAISE EXCEPTION 'Archivering verving de gebundelde klantmelding niet';END IF;
 PERFORM public.set_agency_client_archived(v_manager,v_workspace,v_client,false);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND event_key='agency-client:'||v_client::TEXT AND body='restored|Meldingsklant|') THEN
  RAISE EXCEPTION 'Herstelmelding ontbreekt';END IF;
END $$;
ROLLBACK;
