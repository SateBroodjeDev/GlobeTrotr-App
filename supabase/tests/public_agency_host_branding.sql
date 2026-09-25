-- Uitvoeren na 20260908174000_public_agency_host_branding.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT has_function_privilege('anon','public.get_public_agency_host_branding(text)','EXECUTE') THEN RAISE EXCEPTION 'PUBLIC_AGENCY_BRANDING_RPC_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='agency-logos' AND public=true) THEN RAISE EXCEPTION 'PUBLIC_AGENCY_LOGO_BUCKET_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='agency.white-label-host') THEN RAISE EXCEPTION 'WHITE_LABEL_HOST_ACCEPTANCE_MISSING';END IF;
END $$;
