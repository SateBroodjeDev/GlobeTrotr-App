-- Uitvoeren na 20260908111000_final_production_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN(
  'trip.gpx-production','trip.guide-production','trip.settlement-linked-members',
  'corporate.mail-default-signature','mail.auth-production','mail.agency-branding'
 )) <> 6 THEN RAISE EXCEPTION 'FINAL_PRODUCTION_ACCEPTANCE_MISSING'; END IF;
END $$;
