-- Uitvoeren na 20260908181000_object_storage_metadata.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='stored_objects') THEN
    RAISE EXCEPTION 'STORED_OBJECTS_TABLE_MISSING';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class
    WHERE oid='public.stored_objects'::regclass) THEN
    RAISE EXCEPTION 'STORED_OBJECTS_RLS_MISSING';
  END IF;
  IF has_table_privilege('anon','public.stored_objects','SELECT')
    OR has_table_privilege('authenticated','public.stored_objects','SELECT')
    OR has_table_privilege('authenticated','public.stored_objects','INSERT') THEN
    RAISE EXCEPTION 'STORED_OBJECTS_EXPOSED';
  END IF;
  IF (SELECT count(*) FROM pg_indexes WHERE schemaname='public'
    AND indexname IN('stored_objects_trip_status_idx','stored_objects_workspace_status_idx'))<>2 THEN
    RAISE EXCEPTION 'STORED_OBJECTS_INDEXES_MISSING';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items
    WHERE item_key='storage.provider-gateway') THEN
    RAISE EXCEPTION 'STORED_OBJECTS_ACCEPTANCE_MISSING';
  END IF;
END $$;
