-- Uitvoeren na 20260908035000_agency_clients.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_client_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id,gen_random_uuid() other_workspace_id,gen_random_uuid() trip_id,gen_random_uuid() other_trip_id,gen_random_uuid() client_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'client-owner@example.invalid',now() FROM agency_client_ids;
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
