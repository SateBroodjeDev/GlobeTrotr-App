-- Uitvoeren na 20260908090000_route_tools_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.route-tools') THEN
   RAISE EXCEPTION 'ROUTE_TOOLS_ACCEPTANCE_ITEM_MISSING';
 END IF;
END $$;
