-- Uitvoeren na 20260908052000_trip_document_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tdn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,gen_random_uuid() workspace_id,gen_random_uuid() trip_id,gen_random_uuid() document_id;
INSERT INTO auth.users(id,email,email_confirmed_at)SELECT owner_id,'doc-owner@example.invalid',now()FROM tdn UNION ALL SELECT member_id,'doc-member@example.invalid',now()FROM tdn;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM tdn;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)SELECT owner_id,workspace_id,trip_id::TEXT,trip_id,'Documentreis'FROM tdn;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status)SELECT owner_id,trip_id::TEXT,trip_id,'doc-member',member_id,'Documentlid','doc-member@example.invalid','traveler','active'FROM tdn;
DO $$ DECLARE v_document UUID;BEGIN
 SELECT document_id INTO v_document FROM tdn;
 INSERT INTO public.trip_documents(workspace_user_id,trip_id,trip_uuid,id,storage_path,file_name,document_type,created_by,updated_by)SELECT owner_id,trip_id::TEXT,trip_id,v_document,trip_id::TEXT||'/test.pdf','test.pdf','ticket',owner_id,owner_id FROM tdn;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM tdn) AND event_key='trip-document:'||v_document::TEXT AND body='added|test.pdf|') THEN RAISE EXCEPTION 'Documentmelding ontbreekt';END IF;
 UPDATE public.trip_documents SET expires_on=current_date+30,updated_by=(SELECT owner_id FROM tdn) WHERE id=v_document;
 IF (SELECT count(*) FROM public.notifications WHERE user_id=(SELECT member_id FROM tdn) AND event_key='trip-document:'||v_document::TEXT)<>1 OR NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM tdn) AND body LIKE 'expiry|test.pdf|%') THEN RAISE EXCEPTION 'Vervaldatummelding is niet gebundeld';END IF;
 DELETE FROM public.trip_documents WHERE id=v_document;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=(SELECT member_id FROM tdn) AND body LIKE 'removed|test.pdf|%') THEN RAISE EXCEPTION 'Verwijdermelding ontbreekt';END IF;
END $$;
ROLLBACK;
