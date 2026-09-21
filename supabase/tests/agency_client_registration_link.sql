-- Uitvoeren na 20260908127000_agency_client_registration_link.sql.
-- Alle testgegevens worden teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_registration_ids AS
SELECT gen_random_uuid() owner_id, gen_random_uuid() client_user_id,
  gen_random_uuid() workspace_id, gen_random_uuid() trip_id,
  gen_random_uuid() unrelated_trip_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, 'agency-registration-owner@example.invalid', now()
FROM agency_registration_ids;
INSERT INTO public.workspaces(user_id, workspace_uuid, plan)
SELECT owner_id, workspace_id, 'agency' FROM agency_registration_ids;
INSERT INTO public.trips(workspace_user_id, workspace_uuid, id, trip_uuid, name)
SELECT owner_id, workspace_id, trip_id::TEXT, trip_id, 'Klantreis'
FROM agency_registration_ids;
INSERT INTO public.trips(workspace_user_id, workspace_uuid, id, trip_uuid, name)
SELECT owner_id, workspace_id, unrelated_trip_id::TEXT, unrelated_trip_id, 'Andere reis'
FROM agency_registration_ids;

DO $$
DECLARE v_ids RECORD; v_client UUID;
BEGIN
  SELECT * INTO v_ids FROM agency_registration_ids;
  SELECT public.save_agency_client(v_ids.owner_id, v_ids.workspace_id, NULL,
    '{"fullName":"Nieuwe klant","email":"new-agency-client@example.invalid","locale":"en"}'::JSONB,
    ARRAY[v_ids.trip_id]) INTO v_client;

  INSERT INTO auth.users(id, email)
  VALUES(v_ids.client_user_id, 'new-agency-client@example.invalid');
  -- Een Agency-beheerder kan de klant opnieuw opslaan terwijl de mail nog
  -- onbevestigd is. Ook dat pad mag het account niet activeren.
  PERFORM public.save_agency_client(v_ids.owner_id, v_ids.workspace_id, v_client,
    '{"fullName":"Nieuwe klant","email":"new-agency-client@example.invalid","locale":"en"}'::JSONB,
    ARRAY[v_ids.trip_id]);
  IF EXISTS (SELECT 1 FROM public.trip_members WHERE user_id = v_ids.client_user_id) THEN
    RAISE EXCEPTION 'Onbevestigd klantaccount kreeg reistoegang';
  END IF;

  UPDATE auth.users SET email_confirmed_at = now()
  WHERE id = v_ids.client_user_id;
  IF (SELECT count(*) FROM public.trip_members
      WHERE user_id = v_ids.client_user_id AND role = 'client'
        AND status = 'active' AND agency_client_id = v_client
        AND trip_uuid = v_ids.trip_id) <> 1 THEN
    RAISE EXCEPTION 'Bevestigd klantaccount kreeg niet precies een gekoppelde reis';
  END IF;
  IF EXISTS (SELECT 1 FROM public.trip_members
      WHERE user_id = v_ids.client_user_id AND trip_uuid = v_ids.unrelated_trip_id) THEN
    RAISE EXCEPTION 'Niet-gekoppelde Agency-reis werd zichtbaar';
  END IF;

  UPDATE auth.users SET email = 'changed-agency-client@example.invalid'
  WHERE id = v_ids.client_user_id;
  IF EXISTS (SELECT 1 FROM public.trip_members
      WHERE user_id = v_ids.client_user_id AND agency_client_id = v_client) THEN
    RAISE EXCEPTION 'Adreswijziging trok de oude klanttoegang niet in';
  END IF;
  UPDATE auth.users SET email = 'new-agency-client@example.invalid'
  WHERE id = v_ids.client_user_id;
  IF NOT EXISTS (SELECT 1 FROM public.trip_members
      WHERE user_id = v_ids.client_user_id AND agency_client_id = v_client) THEN
    RAISE EXCEPTION 'Klanttoegang werd na herstel van e-mailadres niet hersteld';
  END IF;
  PERFORM public.set_agency_client_archived(v_ids.owner_id, v_ids.workspace_id, v_client, true);
  IF EXISTS (SELECT 1 FROM public.trip_members
      WHERE user_id = v_ids.client_user_id AND agency_client_id = v_client) THEN
    RAISE EXCEPTION 'Archiveren liet klanttoegang bestaan';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
      WHERE item_key = 'agency.client-register-after-link'
        AND completed_at IS NULL) THEN
    RAISE EXCEPTION 'Agency-acceptatiecontrole ontbreekt of is onterecht voltooid';
  END IF;
END $$;
ROLLBACK;
