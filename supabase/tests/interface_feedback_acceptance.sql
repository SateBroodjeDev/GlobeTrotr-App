-- Uitvoeren na 20260908098000_interface_feedback_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('public.demo-interaction','public.contact-icons','ui.signed-in-menu-order','trip.cover-settings-layout'))<>4 THEN
   RAISE EXCEPTION 'INTERFACE_FEEDBACK_ACCEPTANCE_MISSING';
 END IF;
END $$;
