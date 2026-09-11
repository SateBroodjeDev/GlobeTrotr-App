-- Uitvoeren na 20260908038000_agency_notification_preferences.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_notification_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'notification-owner@example.invalid',now() FROM agency_notification_ids
UNION ALL SELECT member_id,'notification-member@example.invalid',now() FROM agency_notification_ids
UNION ALL SELECT outsider_id,'notification-outsider@example.invalid',now() FROM agency_notification_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_notification_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status) SELECT workspace_id,owner_id,'owner','active' FROM agency_notification_ids
UNION ALL SELECT workspace_id,member_id,'advisor','active' FROM agency_notification_ids;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)
SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Meldingenreis' FROM agency_notification_ids;
DO $$ DECLARE ids RECORD; prefs JSONB; BEGIN
  SELECT * INTO ids FROM agency_notification_ids;
  prefs:=public.get_agency_notification_preferences(ids.member_id);
  IF prefs IS NULL OR NOT (prefs->>'tripChanges')::BOOLEAN THEN RAISE EXCEPTION 'Standaardvoorkeuren ontbreken'; END IF;
  IF NOT public.save_agency_notification_preferences(ids.member_id,'{"tripChanges":false,"invitationResponses":true,"clientUpdates":false}'::JSONB) THEN RAISE EXCEPTION 'Opslaan mislukt'; END IF;
  prefs:=public.get_agency_notification_preferences(ids.member_id);
  IF (prefs->>'tripChanges')::BOOLEAN OR (prefs->>'clientUpdates')::BOOLEAN THEN RAISE EXCEPTION 'Voorkeuren niet bewaard'; END IF;
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  VALUES(ids.member_id,'trip_change','Test','Deze melding moet worden onderdrukt',ids.trip_id,'trip:'||ids.trip_id::TEXT);
  IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=ids.member_id AND event_key='trip:'||ids.trip_id::TEXT) THEN RAISE EXCEPTION 'Uitgeschakelde reismelding werd toch opgeslagen'; END IF;
  IF public.get_agency_notification_preferences(ids.outsider_id) IS NOT NULL THEN RAISE EXCEPTION 'Buitenstaander kreeg Agency-voorkeuren'; END IF;
END $$;
ROLLBACK;
