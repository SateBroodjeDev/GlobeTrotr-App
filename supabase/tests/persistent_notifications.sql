-- Uitvoeren in de SQL Editor NA 20260907120000_persistent_notifications.sql.
-- Testdata en wijzigingen worden volledig teruggedraaid. Geen e-mails verstuurd.
BEGIN;
CREATE TEMP TABLE notification_test_ids AS
  SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS member_id, gen_random_uuid() AS trip_id;

-- De test schakelt naar `authenticated` en blijft deze tijdelijke UUID's
-- gebruiken. Het tijdelijke leesrecht verdwijnt samen met de ROLLBACK.
GRANT SELECT ON notification_test_ids TO authenticated;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM notification_test_ids
UNION ALL
SELECT member_id, member_id::TEXT || '@example.invalid', now() FROM notification_test_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM notification_test_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Meldingentest' FROM notification_test_ids;
INSERT INTO public.trip_members(workspace_user_id, trip_id, trip_uuid, id, user_id, name, email, role, status)
SELECT owner_id, trip_id::TEXT, trip_id, 'test-member', member_id, 'Testreiziger',
  member_id::TEXT || '@example.invalid', 'traveler', 'active' FROM notification_test_ids;

SELECT set_config('request.jwt.claim.sub', owner_id::TEXT, true) FROM notification_test_ids;
UPDATE public.profiles SET display_name = 'Gewijzigde testnaam'
WHERE id = (SELECT owner_id FROM notification_test_ids);
UPDATE public.trips SET name = 'Gewijzigde testreis'
WHERE trip_uuid = (SELECT trip_id FROM notification_test_ids);
UPDATE public.trips SET budget = 100
WHERE trip_uuid = (SELECT trip_id FROM notification_test_ids);
SET CONSTRAINTS ALL IMMEDIATE;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.notifications WHERE user_id = (SELECT owner_id FROM notification_test_ids) AND kind = 'account') <> 1 THEN
    RAISE EXCEPTION 'Accountwijziging moet één melding opleveren';
  END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id = (SELECT member_id FROM notification_test_ids) AND kind = 'trip_change') <> 1 THEN
    RAISE EXCEPTION 'Meerdere reiswijzigingen in één transactie moeten één melding opleveren';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = (SELECT owner_id FROM notification_test_ids) AND kind = 'trip_change') THEN
    RAISE EXCEPTION 'De actor mag geen melding van zijn eigen reiswijziging krijgen';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', member_id::TEXT, true) FROM notification_test_ids;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_id UUID;
BEGIN
  IF (SELECT count(*) FROM public.notifications) <> 1 THEN
    RAISE EXCEPTION 'RLS lekt meldingen van een ander account';
  END IF;
  SELECT id INTO v_id FROM public.notifications;
  PERFORM * FROM public.notifications WHERE id = v_id;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE id = v_id AND dismissed_at IS NULL) THEN
    RAISE EXCEPTION 'Lezen mag een melding niet verwijderen';
  END IF;
  BEGIN
    UPDATE public.notifications SET title = 'Vervalste melding' WHERE id = v_id;
    RAISE EXCEPTION 'Een ontvanger mag de inhoud niet wijzigen';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.notifications SET dismissed_at = now() WHERE id = v_id;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE id = v_id AND dismissed_at IS NULL) THEN
    RAISE EXCEPTION 'Weggeklikte melding blijft zichtbaar';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE id = v_id AND dismissed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Wegklikken moet in de database bewaard blijven';
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
