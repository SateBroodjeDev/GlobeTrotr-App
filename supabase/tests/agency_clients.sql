-- Uitvoeren na 20260908037000_fix_agency_clients_and_operations.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_client_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() client_user_id,gen_random_uuid() workspace_id,gen_random_uuid() other_workspace_id,gen_random_uuid() trip_id,gen_random_uuid() other_trip_id,gen_random_uuid() client_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'client-owner@example.invalid',now() FROM agency_client_ids
UNION ALL SELECT client_user_id,'klant@example.invalid',now() FROM agency_client_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_client_ids;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name) SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Klantreis' FROM agency_client_ids;
DO $$
DECLARE v_client UUID; v_owner UUID; v_workspace UUID; v_trip UUID; v_missing UUID:=gen_random_uuid();
BEGIN
  SELECT owner_id,workspace_id,trip_id INTO v_owner,v_workspace,v_trip FROM agency_client_ids;
  SELECT public.save_agency_client(v_owner,v_workspace,NULL,
    jsonb_build_object('fullName','Testklant','email','klant@example.invalid','locale','nl'),
    ARRAY[v_trip]) INTO v_client;
  IF NOT EXISTS(SELECT 1 FROM public.agency_client_trips WHERE client_id=v_client AND trip_uuid=v_trip) THEN
    RAISE EXCEPTION 'Klantreis ontbreekt';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.trip_members WHERE agency_client_id=v_client AND trip_uuid=v_trip AND role='client' AND status='active') THEN
    RAISE EXCEPTION 'Bestaand klantaccount kreeg geen actieve reistoegang';
  END IF;
  PERFORM public.set_agency_client_archived(v_owner,v_workspace,v_client,true);
  IF EXISTS(SELECT 1 FROM public.trip_members WHERE agency_client_id=v_client) THEN
    RAISE EXCEPTION 'Archiveren trok de automatisch verleende reistoegang niet in';
  END IF;
  PERFORM public.save_agency_client(v_owner,v_workspace,v_client,
    jsonb_build_object('fullName','Testklant','email','klant@example.invalid','locale','nl'),ARRAY[v_trip]);
  IF EXISTS(SELECT 1 FROM public.trip_members WHERE agency_client_id=v_client) THEN
    RAISE EXCEPTION 'Opslaan van een gearchiveerde klant heractiveerde de reistoegang';
  END IF;
  PERFORM public.set_agency_client_archived(v_owner,v_workspace,v_client,false);
  IF NOT EXISTS(SELECT 1 FROM public.trip_members WHERE agency_client_id=v_client AND trip_uuid=v_trip AND status='active') THEN
    RAISE EXCEPTION 'Herstellen activeerde de gekoppelde reistoegang niet opnieuw';
  END IF;
  BEGIN
    PERFORM public.save_agency_client(v_owner,v_workspace,v_client,
      jsonb_build_object('fullName','Onvolledige wijziging','email','klant@example.invalid','locale','nl'),
      ARRAY[v_missing]);
    RAISE EXCEPTION 'Een ongeldige reiskoppeling werd geaccepteerd';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  IF NOT EXISTS(SELECT 1 FROM public.agency_clients WHERE id=v_client AND full_name='Testklant')
    OR NOT EXISTS(SELECT 1 FROM public.agency_client_trips WHERE client_id=v_client AND trip_uuid=v_trip) THEN
    RAISE EXCEPTION 'Een mislukte opslag is niet atomair teruggedraaid';
  END IF;
END $$;
ROLLBACK;
