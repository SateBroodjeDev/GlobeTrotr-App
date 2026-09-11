-- Uitvoeren na 20260908040000_trip_document_expiry.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE document_test_ids AS SELECT gen_random_uuid() owner_id,
  gen_random_uuid() advisor_id,gen_random_uuid() blocked_id,gen_random_uuid() viewer_id,
  gen_random_uuid() outsider_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id;
GRANT SELECT ON document_test_ids TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id,'document-owner@example.invalid',now() FROM document_test_ids UNION ALL
SELECT advisor_id,'document-advisor@example.invalid',now() FROM document_test_ids UNION ALL
SELECT blocked_id,'document-blocked@example.invalid',now() FROM document_test_ids UNION ALL
SELECT viewer_id,'document-viewer@example.invalid',now() FROM document_test_ids UNION ALL
SELECT outsider_id,'document-outsider@example.invalid',now() FROM document_test_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)
SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM document_test_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)
SELECT workspace_id,advisor_id,'advisor','active',now(),'{}'::JSONB FROM document_test_ids UNION ALL
SELECT workspace_id,blocked_id,'advisor','active',now(),'{"trips_plan":false}'::JSONB FROM document_test_ids;
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions)
SELECT workspace_id,'advisor','{"trips_view":true,"trips_plan":true}'::JSONB FROM document_test_ids
ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)
SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Documenttest' FROM document_test_ids;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
SELECT owner_id,trip_id::TEXT,trip_id,'document-viewer',viewer_id,'Viewer','document-viewer@example.invalid','viewer','active',now() FROM document_test_ids;
INSERT INTO public.trip_travel_items(workspace_user_id,trip_id,trip_uuid,id,item_type,title,start_date)
SELECT owner_id,trip_id::TEXT,trip_id,'document-flight','flight','Testvlucht',current_date FROM document_test_ids;
INSERT INTO public.trip_documents(workspace_user_id,trip_id,trip_uuid,id,storage_path,file_name,mime_type,size_bytes,document_type)
SELECT owner_id,trip_id::TEXT,trip_id,gen_random_uuid(),trip_id::TEXT||'/existing/test.pdf','test.pdf','application/pdf',100,'ticket' FROM document_test_ids;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',advisor_id::TEXT,true) FROM document_test_ids;
DO $$ DECLARE trip UUID; BEGIN SELECT trip_id INTO trip FROM document_test_ids;
  IF NOT private.can_manage_trip_documents(trip) OR (SELECT count(*) FROM public.trip_documents)<>1 THEN RAISE EXCEPTION 'Bevoegde adviseur kan reisdocumenten niet beheren'; END IF;
  UPDATE public.trip_documents SET travel_item_id='document-flight',expires_on=current_date+10 WHERE trip_uuid=trip;
  IF NOT EXISTS(SELECT 1 FROM public.trip_documents WHERE trip_uuid=trip AND travel_item_id='document-flight' AND expires_on=current_date+10) THEN RAISE EXCEPTION 'Documentgegevens konden niet worden bijgewerkt'; END IF;
  BEGIN
    UPDATE public.trip_documents SET travel_item_id='bestaat-niet' WHERE trip_uuid=trip;
    RAISE EXCEPTION 'Document werd aan een vreemd reisonderdeel gekoppeld';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub',blocked_id::TEXT,true) FROM document_test_ids;
DO $$ DECLARE trip UUID; BEGIN SELECT trip_id INTO trip FROM document_test_ids;
  IF private.can_manage_trip_documents(trip) THEN RAISE EXCEPTION 'Persoonlijke blokkade voor documenten wordt genegeerd'; END IF;
  IF (SELECT count(*) FROM public.trip_documents)<>1 THEN RAISE EXCEPTION 'Geblokkeerde adviseur kan document niet lezen'; END IF;
  DELETE FROM public.trip_documents WHERE trip_uuid=trip;
  IF NOT EXISTS(SELECT 1 FROM public.trip_documents WHERE trip_uuid=trip) THEN RAISE EXCEPTION 'Geblokkeerde adviseur kon document verwijderen'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',viewer_id::TEXT,true) FROM document_test_ids;
DO $$ DECLARE trip UUID; BEGIN SELECT trip_id INTO trip FROM document_test_ids;
  IF private.can_manage_trip_documents(trip) OR (SELECT count(*) FROM public.trip_documents)<>1 THEN RAISE EXCEPTION 'Viewerrechten voor documenten kloppen niet'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',outsider_id::TEXT,true) FROM document_test_ids;
DO $$ BEGIN IF (SELECT count(*) FROM public.trip_documents)<>0 THEN RAISE EXCEPTION 'Document lekt naar buitenstaander'; END IF; END $$;
RESET ROLE;
ROLLBACK;
