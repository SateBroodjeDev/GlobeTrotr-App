-- Private reisdocumenten via de stabiele reis-UUID en effectieve reisrechten.
-- Uitvoeren na 20260908038000_agency_notification_preferences.sql.
BEGIN;

ALTER TABLE public.trip_documents DROP CONSTRAINT IF EXISTS trip_documents_type_check;
ALTER TABLE public.trip_documents ADD CONSTRAINT trip_documents_type_check
  CHECK(document_type IN('ticket','voucher','insurance','visa','booking','other'));
CREATE UNIQUE INDEX IF NOT EXISTS trip_documents_storage_path_idx ON public.trip_documents(storage_path);

CREATE OR REPLACE FUNCTION private.can_manage_trip_documents(target_trip_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT COALESCE((SELECT CASE
    WHEN private.is_trip_owner(trip.trip_uuid) THEN true
    WHEN private.workspace_role(trip.workspace_uuid) IS NOT NULL
      THEN private.workspace_has_permission(trip.workspace_uuid,'trips_plan')
    ELSE private.can_plan_trip(trip.trip_uuid)
  END FROM public.trips trip WHERE trip.trip_uuid=target_trip_uuid),false)
$$;

DROP POLICY IF EXISTS "Planners manage trip documents" ON public.trip_documents;
CREATE POLICY "Effective planners manage trip documents" ON public.trip_documents FOR ALL TO authenticated
  USING((SELECT private.can_manage_trip_documents(trip_uuid)))
  WITH CHECK((SELECT private.can_manage_trip_documents(trip_uuid)));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('trip-documents','trip-documents',false,15728640,ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=15728640,allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Trip members read documents" ON storage.objects;
DROP POLICY IF EXISTS "Trip planners upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Trip planners update documents" ON storage.objects;
DROP POLICY IF EXISTS "Trip planners delete documents" ON storage.objects;
CREATE POLICY "Trip members read documents" ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='trip-documents' AND CASE
  WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN private.can_view_trip(((storage.foldername(name))[1])::UUID) ELSE false END);
CREATE POLICY "Trip planners upload documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='trip-documents' AND CASE
  WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN private.can_manage_trip_documents(((storage.foldername(name))[1])::UUID) ELSE false END);
CREATE POLICY "Trip planners update documents" ON storage.objects FOR UPDATE TO authenticated
USING(bucket_id='trip-documents' AND CASE
  WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN private.can_manage_trip_documents(((storage.foldername(name))[1])::UUID) ELSE false END)
WITH CHECK(bucket_id='trip-documents' AND CASE
  WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN private.can_manage_trip_documents(((storage.foldername(name))[1])::UUID) ELSE false END);
CREATE POLICY "Trip planners delete documents" ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='trip-documents' AND CASE
  WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN private.can_manage_trip_documents(((storage.foldername(name))[1])::UUID) ELSE false END);

REVOKE ALL ON FUNCTION private.can_manage_trip_documents(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_manage_trip_documents(UUID) TO authenticated,service_role;
COMMIT;
