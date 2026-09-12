-- Uitvoeren na 20260908056000_trip_access_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tan AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,
 gen_random_uuid() trip_id,gen_random_uuid() invitation_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'access-owner@example.invalid',now() FROM tan
 UNION ALL SELECT member_id,'access-member@example.invalid',now() FROM tan;
INSERT INTO public.workspaces(user_id,data) SELECT owner_id,'{}'::JSONB FROM tan;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name) SELECT owner_id,trip_id::TEXT,trip_id,'Toegangsreis' FROM tan;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'access-member',member_id,'Testlid','access-member@example.invalid','viewer','active',now() FROM tan;
INSERT INTO public.trip_invitations(id,trip_uuid,email,role,token_hash,invited_by,expires_at)
 SELECT invitation_id,trip_id,'access-member@example.invalid','traveler',repeat('a',64),owner_id,now()+interval '7 days' FROM tan;
DO $$ DECLARE v_owner UUID;v_member UUID;v_trip UUID;v_invitation UUID;BEGIN
 SELECT owner_id,member_id,trip_id,invitation_id INTO v_owner,v_member,v_trip,v_invitation FROM tan;
 UPDATE public.trip_members SET role='finance' WHERE trip_uuid=v_trip AND user_id=v_member;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND kind='trip_access' AND body='role|Toegangsreis|finance') THEN RAISE EXCEPTION 'Rolwijzigingsmelding ontbreekt';END IF;
 IF (public.manage_trip_invitation(v_invitation,v_trip,v_owner,'revoke',NULL)->>'status')<>'revoked' THEN RAISE EXCEPTION 'Uitnodiging werd niet ingetrokken';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND kind='trip_access' AND body='revoked|Toegangsreis|') THEN RAISE EXCEPTION 'Intrekkingsmelding ontbreekt';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND event_key='invitation:'||v_invitation::TEXT AND dismissed_at IS NULL) THEN RAISE EXCEPTION 'Actie-uitnodiging bleef open';END IF;
END $$;
ROLLBACK;
