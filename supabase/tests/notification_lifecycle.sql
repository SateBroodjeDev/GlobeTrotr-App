-- Uitvoeren na 20260908028000_platform_status_lifecycle.sql.
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
SELECT public.publish_platform_announcement_v2(
  owner_id, 'update', 'info', 'Belangrijke update', 'Important update',
  'Nederlandse tekst', 'English text', NULL
) FROM notification_lifecycle_ids;
SELECT public.publish_platform_announcement_v2(
  owner_id, 'status', 'warning', 'Storing', 'Incident',
  'Er is een storing', 'There is an incident', NULL
) FROM notification_lifecycle_ids;
SELECT public.publish_platform_announcement_v2(
  ids.owner_id, 'status', 'resolved', 'Storing opgelost', 'Incident resolved',
  'De storing is opgelost', 'The incident is resolved', announcement.status_key
)
FROM notification_lifecycle_ids ids
JOIN public.platform_announcements announcement
  ON announcement.title_nl='Storing'
 AND announcement.created_by=ids.owner_id;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND kind='membership') THEN RAISE EXCEPTION 'Verwijdermelding ontbreekt'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM notification_lifecycle_ids) AND kind='feedback') THEN RAISE EXCEPTION 'Feedbackmelding ontbreekt'; END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id IN (SELECT owner_id FROM notification_lifecycle_ids UNION ALL SELECT member_id FROM notification_lifecycle_ids) AND kind='platform' AND split_part(body,'|',1)='update') <> 2 THEN RAISE EXCEPTION 'Platformbericht bereikte niet beide accounts'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id IN (
      SELECT owner_id FROM notification_lifecycle_ids
      UNION ALL SELECT member_id FROM notification_lifecycle_ids
    )
      AND kind='platform'
      AND split_part(body,'|',2)='warning'
      AND dismissed_at IS NULL
  ) THEN RAISE EXCEPTION 'Opgeloste statusbanner bleef zichtbaar'; END IF;
  IF (
    SELECT count(*) FROM public.notifications
    WHERE user_id IN (
      SELECT owner_id FROM notification_lifecycle_ids
      UNION ALL SELECT member_id FROM notification_lifecycle_ids
    )
      AND kind='platform'
      AND split_part(body,'|',2)='resolved'
      AND dismissed_at IS NULL
  ) <> 2 THEN RAISE EXCEPTION 'Oplossingsmelding ontbreekt'; END IF;
END $$;
ROLLBACK;
