-- Persoonlijke meldingsvoorkeuren voor leden van een Agency-workspace.
-- Uitvoeren na 20260908037000_fix_agency_clients_and_operations.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agency_notification_preferences (
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_changes BOOLEAN NOT NULL DEFAULT true,
  invitation_responses BOOLEAN NOT NULL DEFAULT true,
  client_updates BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_uuid, user_id)
);

CREATE OR REPLACE FUNCTION public.get_agency_notification_preferences(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_row public.agency_notification_preferences%ROWTYPE;
BEGIN
  SELECT member.workspace_uuid INTO v_workspace FROM public.workspace_members member
  JOIN public.workspaces workspace ON workspace.workspace_uuid=member.workspace_uuid AND workspace.plan='agency'
  WHERE member.user_id=p_user_id AND member.status='active' LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.agency_notification_preferences(workspace_uuid,user_id)
  VALUES(v_workspace,p_user_id) ON CONFLICT DO NOTHING;
  SELECT * INTO v_row FROM public.agency_notification_preferences
  WHERE workspace_uuid=v_workspace AND user_id=p_user_id;
  RETURN jsonb_build_object('workspaceId',v_workspace,'tripChanges',v_row.trip_changes,
    'invitationResponses',v_row.invitation_responses,'clientUpdates',v_row.client_updates);
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_notification_preferences(p_user_id UUID,p_preferences JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID;
BEGIN
  SELECT member.workspace_uuid INTO v_workspace FROM public.workspace_members member
  JOIN public.workspaces workspace ON workspace.workspace_uuid=member.workspace_uuid AND workspace.plan='agency'
  WHERE member.user_id=p_user_id AND member.status='active' LIMIT 1;
  IF NOT FOUND OR jsonb_typeof(p_preferences)<>'object'
    OR jsonb_typeof(p_preferences->'tripChanges')<>'boolean'
    OR jsonb_typeof(p_preferences->'invitationResponses')<>'boolean'
    OR jsonb_typeof(p_preferences->'clientUpdates')<>'boolean' THEN RETURN false; END IF;
  INSERT INTO public.agency_notification_preferences(workspace_uuid,user_id,trip_changes,invitation_responses,client_updates,updated_at)
  VALUES(v_workspace,p_user_id,(p_preferences->>'tripChanges')::BOOLEAN,
    (p_preferences->>'invitationResponses')::BOOLEAN,(p_preferences->>'clientUpdates')::BOOLEAN,now())
  ON CONFLICT(workspace_uuid,user_id) DO UPDATE SET trip_changes=EXCLUDED.trip_changes,
    invitation_responses=EXCLUDED.invitation_responses,client_updates=EXCLUDED.client_updates,updated_at=now();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.apply_agency_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_invitation UUID;
BEGIN
  -- Wegklikken en andere lifecycle-updates moeten altijd mogelijk blijven.
  IF NEW.dismissed_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.kind='trip_change' AND NEW.trip_uuid IS NOT NULL THEN
    SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip WHERE trip.trip_uuid=NEW.trip_uuid;
    IF EXISTS(SELECT 1 FROM public.agency_notification_preferences preference
      WHERE preference.workspace_uuid=v_workspace AND preference.user_id=NEW.user_id AND NOT preference.trip_changes)
    THEN RETURN NULL; END IF;
  ELSIF NEW.event_key LIKE 'workspace-invitation-response:%' THEN
    BEGIN v_invitation:=split_part(NEW.event_key,':',3)::UUID; EXCEPTION WHEN invalid_text_representation THEN RETURN NEW; END;
    SELECT invitation.workspace_uuid INTO v_workspace FROM public.workspace_invitations invitation WHERE invitation.id=v_invitation;
    IF EXISTS(SELECT 1 FROM public.agency_notification_preferences preference
      WHERE preference.workspace_uuid=v_workspace AND preference.user_id=NEW.user_id AND NOT preference.invitation_responses)
    THEN RETURN NULL; END IF;
  ELSIF NEW.event_key LIKE 'agency-client:%' AND NEW.trip_uuid IS NOT NULL THEN
    SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip WHERE trip.trip_uuid=NEW.trip_uuid;
    IF EXISTS(SELECT 1 FROM public.agency_notification_preferences preference
      WHERE preference.workspace_uuid=v_workspace AND preference.user_id=NEW.user_id AND NOT preference.client_updates)
    THEN RETURN NULL; END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS apply_agency_notification_preferences ON public.notifications;
CREATE TRIGGER apply_agency_notification_preferences BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.apply_agency_notification_preferences();

ALTER TABLE public.agency_notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_notification_preferences FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.agency_notification_preferences TO service_role;
REVOKE ALL ON FUNCTION public.get_agency_notification_preferences(UUID),public.save_agency_notification_preferences(UUID,JSONB) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.apply_agency_notification_preferences() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_notification_preferences(UUID),public.save_agency_notification_preferences(UUID,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
