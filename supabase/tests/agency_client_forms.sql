-- Uitvoeren na 20260908155000_agency_client_forms.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN
   ('agency_form_templates','agency_form_requests','agency_form_responses'))<>3 THEN RAISE EXCEPTION 'AGENCY_CLIENT_FORM_TABLES_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='validate_agency_form_template' AND NOT tgisinternal) THEN RAISE EXCEPTION 'AGENCY_FORM_VALIDATION_MISSING';END IF;
 IF has_table_privilege('authenticated','public.agency_form_responses','SELECT') THEN RAISE EXCEPTION 'AGENCY_FORM_RESPONSES_EXPOSED';END IF;
 IF has_function_privilege('anon','public.get_public_agency_form(text)','EXECUTE') OR has_function_privilege('authenticated','public.submit_public_agency_form(text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'AGENCY_FORM_RPC_EXPOSED';END IF;
 IF has_function_privilege('authenticated','public.cleanup_expired_agency_form_data(timestamp with time zone)','EXECUTE') THEN RAISE EXCEPTION 'AGENCY_FORM_CLEANUP_EXPOSED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.client-forms') THEN RAISE EXCEPTION 'AGENCY_CLIENT_FORMS_ACCEPTANCE_MISSING';END IF;
 IF NOT private.validate_agency_form_fields('[{"key":"arrival_date","type":"date","labelNl":"Aankomstdatum","labelEn":"Arrival date","purpose":"Reisplanning","required":true,"visibility":"client"}]'::jsonb) THEN RAISE EXCEPTION 'AGENCY_FORM_VALID_FIELDS_REJECTED';END IF;
 IF private.validate_agency_form_fields('[{"key":"password","type":"text","labelNl":"Wachtwoord","labelEn":"Password","purpose":"Login","required":true,"visibility":"client"}]'::jsonb) THEN RAISE EXCEPTION 'AGENCY_FORM_SECRET_FIELD_ACCEPTED';END IF;
END $$;
