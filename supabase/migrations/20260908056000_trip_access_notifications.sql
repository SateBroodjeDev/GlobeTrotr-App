-- Meld ingetrokken reisuitnodigingen en gewijzigde deelnamerechten.
-- Uitvoeren na 20260908055000_restore_public_function_grants.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
 CHECK(kind IN('account','trip_change','invitation','membership','feedback','platform','agency_task','agency_quote','agency_access','trip_document','agency_client','trip_access'));

CREATE OR REPLACE FUNCTION private.notify_trip_member_access_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip_name TEXT;v_action TEXT;
BEGIN
 IF NEW.user_id IS NULL OR NEW.role='owner' OR ROW(NEW.role,NEW.status) IS NOT DISTINCT FROM ROW(OLD.role,OLD.status) THEN RETURN NEW;END IF;
 SELECT trip.name INTO v_trip_name FROM public.trips trip WHERE trip.trip_uuid=NEW.trip_uuid;
 v_action:=CASE WHEN NEW.role IS DISTINCT FROM OLD.role THEN 'role' ELSE 'status' END;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 VALUES(NEW.user_id,'trip_access','Reistoegang gewijzigd / Trip access changed',
  v_action||'|'||COALESCE(v_trip_name,'Reis')||'|'||CASE v_action WHEN 'role' THEN NEW.role ELSE NEW.status END,
  NEW.trip_uuid,'trip-member-access:'||NEW.trip_uuid::TEXT)
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
  trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trip_members_notify_access_change ON public.trip_members;
CREATE TRIGGER trip_members_notify_access_change AFTER UPDATE OF role,status ON public.trip_members
 FOR EACH ROW EXECUTE FUNCTION private.notify_trip_member_access_change();

CREATE OR REPLACE FUNCTION public.manage_trip_invitation(
 p_invitation_id UUID,p_trip_uuid UUID,p_owner_id UUID,p_action TEXT,p_token_hash TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_invitation public.trip_invitations%ROWTYPE;v_expires_at TIMESTAMPTZ;v_trip_name TEXT;v_user UUID;
BEGIN
 IF p_invitation_id IS NULL OR p_trip_uuid IS NULL OR p_owner_id IS NULL OR p_action NOT IN('revoke','renew') THEN RETURN jsonb_build_object('status','invalid');END IF;
 IF NOT EXISTS(SELECT 1 FROM public.trips trip WHERE trip.trip_uuid=p_trip_uuid AND trip.workspace_user_id=p_owner_id) THEN RETURN jsonb_build_object('status','forbidden');END IF;
 SELECT invitation.* INTO v_invitation FROM public.trip_invitations invitation
  WHERE invitation.id=p_invitation_id AND invitation.trip_uuid=p_trip_uuid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found');END IF;
 IF v_invitation.accepted_at IS NOT NULL THEN RETURN jsonb_build_object('status','accepted');END IF;
 IF v_invitation.declined_at IS NOT NULL THEN RETURN jsonb_build_object('status','declined');END IF;
 IF v_invitation.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status','revoked');END IF;
 SELECT trip.name INTO v_trip_name FROM public.trips trip WHERE trip.trip_uuid=p_trip_uuid;
 SELECT auth_user.id INTO v_user FROM auth.users auth_user
  WHERE lower(auth_user.email)=lower(v_invitation.email) AND auth_user.email_confirmed_at IS NOT NULL LIMIT 1;

 IF p_action='revoke' THEN
  UPDATE public.trip_invitations invitation SET revoked_at=now(),
   token_hash=md5(invitation.id::TEXT||random()::TEXT)||md5(clock_timestamp()::TEXT||random()::TEXT)
   WHERE invitation.id=p_invitation_id;
  UPDATE public.notifications notification SET dismissed_at=COALESCE(notification.dismissed_at,now())
   WHERE notification.event_key='invitation:'||p_invitation_id::TEXT;
  DELETE FROM public.trip_members member WHERE member.trip_uuid=p_trip_uuid AND member.user_id IS NULL
   AND member.role<>'owner' AND lower(member.email)=lower(v_invitation.email);
  IF v_user IS NOT NULL THEN
   INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
   VALUES(v_user,'trip_access','Uitnodiging ingetrokken / Invitation revoked','revoked|'||COALESCE(v_trip_name,'Reis')||'|',p_trip_uuid,'trip-invitation-lifecycle:'||p_invitation_id::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  END IF;
  RETURN jsonb_build_object('status','revoked');
 END IF;

 IF p_token_hash IS NULL OR p_token_hash!~'^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status','invalid');END IF;
 v_expires_at:=now()+interval '7 days';
 UPDATE public.trip_invitations invitation SET token_hash=p_token_hash,expires_at=v_expires_at WHERE invitation.id=p_invitation_id;
 IF v_user IS NOT NULL THEN
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  VALUES(v_user,'invitation','Reisuitnodiging / Trip invitation','Je bent uitgenodigd voor '||COALESCE(v_trip_name,'Reis')||'.',p_trip_uuid,'invitation:'||p_invitation_id::TEXT)
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
   trip_uuid=EXCLUDED.trip_uuid,dismissed_at=NULL,created_at=now();
 END IF;
 RETURN jsonb_build_object('status','renewed','expiresAt',v_expires_at);
END $$;

REVOKE ALL ON FUNCTION private.notify_trip_member_access_change() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.manage_trip_invitation(UUID,UUID,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_trip_invitation(UUID,UUID,UUID,TEXT,TEXT) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
