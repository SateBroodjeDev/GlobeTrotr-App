-- Uitvoeren na 20260908082000_security_grants_and_release_checks.sql. Alleen-lezen.
DO $$ BEGIN
 IF has_function_privilege('authenticated','public.list_public_testimonials()','EXECUTE') THEN RAISE EXCEPTION 'Authenticated heeft nog een onnodig openbaar SECURITY DEFINER-recht'; END IF;
 IF NOT has_function_privilege('anon','public.get_public_platform_status()','EXECUTE') OR NOT has_function_privilege('anon','public.list_public_testimonials()','EXECUTE') THEN RAISE EXCEPTION 'Bewust openbare functies zijn niet meer anoniem bereikbaar'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('security.quote-isolation','security.exports-and-quota','security.member-privacy','public.dynamic-content','public.about','trip.usability','content.translation-provider'))<>7 THEN RAISE EXCEPTION 'Nieuwe acceptatiecontroles ontbreken'; END IF;
END; $$;
