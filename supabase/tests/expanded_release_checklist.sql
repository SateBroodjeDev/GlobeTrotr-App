-- Uitvoeren na 20260908077000_expand_release_acceptance_checklist.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('public.home','public.demo','billing.paddle','trip.lifecycle','agency.quotes','corporate.operations','security.final'))<>7 THEN RAISE EXCEPTION 'Uitgebreide releasechecklist is onvolledig'; END IF;
 IF EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='public.website') THEN RAISE EXCEPTION 'Verouderde brede websitecontrole bestaat nog'; END IF;
END; $$;
