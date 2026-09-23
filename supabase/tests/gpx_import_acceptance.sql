-- Uitvoeren na 20260908164000_gpx_import_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key='trip.gpx-import'
      AND label_nl LIKE '%maximaal 500%'
      AND label_en LIKE '%duplicates%'
  ) THEN
    RAISE EXCEPTION 'GPX_IMPORT_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
