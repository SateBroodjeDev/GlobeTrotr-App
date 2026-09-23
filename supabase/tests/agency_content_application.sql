-- Uitvoeren na 20260908160000_agency_content_application.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$
DECLARE
  v_owner UUID:=gen_random_uuid();
  v_workspace UUID:=gen_random_uuid();
  v_trip UUID:=gen_random_uuid();
  v_item UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agency_content_applications') THEN
    RAISE EXCEPTION 'AGENCY_CONTENT_APPLICATION_TABLE_MISSING';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='apply_agency_content_item') THEN
    RAISE EXCEPTION 'AGENCY_CONTENT_APPLICATION_FUNCTION_MISSING';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.content-application') THEN
    RAISE EXCEPTION 'AGENCY_CONTENT_APPLICATION_ACCEPTANCE_MISSING';
  END IF;
  INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(v_owner,'content-application@example.invalid',now());
  INSERT INTO public.workspaces(user_id,workspace_uuid,data) VALUES(v_owner,v_workspace,'{"plan":"agency"}'::jsonb);
  INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name,start_date,end_date)
    VALUES(v_owner,v_workspace,v_trip::text,v_trip,'Contentreis',current_date,current_date+2);
  INSERT INTO public.agency_content_library(workspace_uuid,title,content_type,status,visibility,locale,content,owner_user_id,created_by,updated_by)
    VALUES(v_workspace,'Museum','activity','published','organization','nl','{"summary":"Kunst","body":"Reserveer vooraf."}'::jsonb,v_owner,v_owner,v_owner)
    RETURNING id INTO v_item;
  IF public.apply_agency_content_item(v_workspace,v_owner,v_item,'trip',v_trip,current_date)<>'applied'
    OR public.apply_agency_content_item(v_workspace,v_owner,v_item,'trip',v_trip,current_date)<>'duplicate' THEN
    RAISE EXCEPTION 'AGENCY_CONTENT_APPLICATION_IDEMPOTENCY_FAILED';
  END IF;
  IF (SELECT count(*) FROM public.trip_travel_items WHERE trip_uuid=v_trip AND title='Museum')<>1 THEN
    RAISE EXCEPTION 'AGENCY_CONTENT_APPLICATION_TRIP_ITEM_FAILED';
  END IF;
END $$;
ROLLBACK;
