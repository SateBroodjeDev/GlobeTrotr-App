-- Uitvoeren na 20260908088000_public_navigation_about_maintenance_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('public.navigation','public.about','public.maintenance')) <> 3 THEN
   RAISE EXCEPTION 'PUBLIC_EXPERIENCE_ACCEPTANCE_ITEMS_MISSING';
 END IF;
END $$;
