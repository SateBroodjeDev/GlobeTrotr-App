-- Uitvoeren na 20260908097000_production_ui_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('ui.mobile-navigation','ui.touch-targets','content.production-copy'))<>3 THEN
   RAISE EXCEPTION 'PRODUCTION_UI_ACCEPTANCE_MISSING';
 END IF;
END $$;
