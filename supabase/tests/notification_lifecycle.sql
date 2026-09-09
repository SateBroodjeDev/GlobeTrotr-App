-- Uitvoeren na 20260908027000_invitation_cleanup_and_platform_publish.sql.
-- Controleert samengevoegde reis-, verwijder-, feedback- en platformmeldingen.
-- Alle testdata wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE notification_lifecycle_ids AS
SELECT gen_random_uuid() owner_id, gen_random_uuid() member_id, gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM notification_lifecycle_ids
UNION ALL SELECT member_id, member_id::TEXT || '@example.invalid', now() FROM notification_lifecycle_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM notification_lifecycle_ids;
INSERT INTO public.platform_admins(user_id,role,active)
SELECT owner_id,'owner',true FROM notification_lifecycle_ids;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name)
SELECT owner_id,trip_id::TEXT,trip_id,'Meldingentest' FROM notification_lifecycle_ids;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status)
SELECT owner_id,trip_id::TEXT,trip_id,'member',member_id,'Lid',member_id::TEXT||'@example.invalid','traveler','active'
FROM notification_lifecycle_ids;
UPDATE public.trips SET name='Meldingentest 1' WHERE trip_uuid=(SELECT trip_id FROM notification_lifecycle_ids);
UPDATE public.trips SET name='Meldingentest 2' WHERE trip_uuid=(SELECT trip_id FROM notification_lifecycle_ids);
SET CONSTRAINTS ALL IMMEDIATE;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.notifications WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND kind='trip_change') <> 1 THEN
    RAISE EXCEPTION 'Meerdere reiswijzigingen leverden dubbele meldingen op';
  END IF;
END $$;
INSERT INTO public.beta_feedback(user_id,title,description)
SELECT member_id,'Testfeedback','Dit is feedback voor de meldingentest.' FROM notification_lifecycle_ids;
UPDATE public.beta_feedback SET status='reviewing'
WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND title='Testfeedback';
DELETE FROM public.trip_members WHERE id='member' AND trip_uuid=(SELECT trip_id FROM notification_lifecycle_ids);
SELECT public.publish_platform_announcement(
  owner_id, 'update', 'info', 'Belangrijke update', 'Important update',
  'Nederlandse tekst', 'English text'
) FROM notification_lifecycle_ids;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND kind='membership') THEN RAISE EXCEPTION 'Verwijdermelding ontbreekt'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND kind='feedback') THEN RAISE EXCEPTION 'Feedbackmelding ontbreekt'; END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id IN (SELECT owner_id FROM notification_lifecycle_ids UNION ALL SELECT member_id FROM notification_lifecycle_ids) AND kind='platform') <> 2 THEN RAISE EXCEPTION 'Platformbericht bereikte niet beide accounts'; END IF;
END $$;
ROLLBACK;
