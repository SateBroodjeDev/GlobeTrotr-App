-- Uitvoeren na 20260908171000_self_hosted_agency_licensing.sql. Alleen-lezen.
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN('self_hosted_customers','self_hosted_licenses','self_hosted_license_secrets','self_hosted_installations','self_hosted_license_events','self_hosted_audit_log'))<>6 THEN RAISE EXCEPTION 'SELF_HOSTED_TABLES_MISSING';END IF;
 IF (SELECT count(*) FROM information_schema.tables t WHERE t.table_schema='public' AND t.table_name LIKE 'self_hosted_%' AND NOT t.row_security)>0 THEN RAISE EXCEPTION 'SELF_HOSTED_RLS_MISSING';END IF;
 IF has_table_privilege('authenticated','public.self_hosted_license_secrets','SELECT') OR has_table_privilege('anon','public.self_hosted_licenses','SELECT') THEN RAISE EXCEPTION 'SELF_HOSTED_DATA_EXPOSED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.platform_feature_flags WHERE flag_key='self_hosted.sales' AND enabled=false) THEN RAISE EXCEPTION 'SELF_HOSTED_FLAG_NOT_SAFE';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='self-hosted.licensing') THEN RAISE EXCEPTION 'SELF_HOSTED_ACCEPTANCE_MISSING';END IF;
END $$;
