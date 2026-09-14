-- Meld inhoudelijke wijzigingen aan organisatie- en reisbranding atomair.
-- Uitvoeren na 20260908049000_agency_access_notifications.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.notify_agency_branding_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID;v_actor UUID;v_brand TEXT;v_trip_name TEXT;v_user UUID;v_body TEXT;v_key TEXT;
BEGIN
 IF TG_TABLE_NAME='agency_settings' THEN
  IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'updated_at'-'updated_by') IS NOT DISTINCT FROM (to_jsonb(OLD)-'updated_at'-'updated_by') THEN RETURN NEW;END IF;
  v_workspace:=NEW.workspace_uuid;v_actor:=NEW.updated_by;v_brand:=NEW.system_name;v_body:='branding|'||v_brand;v_key:='agency-branding:'||v_workspace::TEXT;
 ELSE
  IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'updated_at'-'updated_by') IS NOT DISTINCT FROM (to_jsonb(OLD)-'updated_at'-'updated_by') THEN RETURN NEW;END IF;
  SELECT trip.workspace_uuid,trip.name INTO v_workspace,v_trip_name FROM public.trips trip WHERE trip.trip_uuid=NEW.trip_uuid;
  IF v_workspace IS NULL THEN RETURN NEW;END IF;
  SELECT COALESCE(NULLIF(settings.system_name,''),'GlobeTrotr Agency') INTO v_brand FROM public.agency_settings settings WHERE settings.workspace_uuid=v_workspace;
  v_actor:=NEW.updated_by;v_body:='trip_branding|'||COALESCE(v_brand,'GlobeTrotr Agency')||'|'||v_trip_name;v_key:='agency-trip-branding:'||NEW.trip_uuid::TEXT;
 END IF;
 FOR v_user IN SELECT user_id FROM public.workspaces WHERE workspace_uuid=v_workspace UNION SELECT user_id FROM public.workspace_members WHERE workspace_uuid=v_workspace AND status='active' AND user_id IS NOT NULL LOOP
  IF v_user IS DISTINCT FROM v_actor AND private.agency_actor_has_permission(v_workspace,v_user,'branding_manage') THEN
   INSERT INTO public.notifications(user_id,kind,title,body,event_key) VALUES(v_user,'agency_access','Agency-huisstijl gewijzigd / Agency branding changed',v_body,v_key)
   ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_agency_settings_change ON public.agency_settings;
CREATE TRIGGER notify_agency_settings_change AFTER UPDATE ON public.agency_settings FOR EACH ROW EXECUTE FUNCTION private.notify_agency_branding_change();
DROP TRIGGER IF EXISTS notify_trip_branding_change ON public.trip_branding_overrides;
CREATE TRIGGER notify_trip_branding_change AFTER INSERT OR UPDATE ON public.trip_branding_overrides FOR EACH ROW EXECUTE FUNCTION private.notify_agency_branding_change();
REVOKE ALL ON FUNCTION private.notify_agency_branding_change() FROM PUBLIC,anon,authenticated;
COMMIT;
