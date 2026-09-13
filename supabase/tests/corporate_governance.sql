-- Uitvoeren na 20260908078000_corporate_governance.sql. Alles wordt teruggedraaid.
BEGIN;
INSERT INTO public.privacy_requests(requester_email,request_type) VALUES('privacy-test@example.invalid','access');
INSERT INTO public.platform_incidents(title,severity,summary) VALUES('Testincident','low','Veilige technische regressietest voor incidentbeheer.');
UPDATE public.platform_feature_flags SET enabled=false WHERE flag_key='billing.checkout';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.privacy_requests WHERE requester_email='privacy-test@example.invalid' AND due_at>received_at) THEN RAISE EXCEPTION 'Privacytermijn ontbreekt';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.platform_incidents WHERE title='Testincident') THEN RAISE EXCEPTION 'Incident ontbreekt';END IF;
 IF has_table_privilege('authenticated','public.privacy_requests','SELECT') OR has_table_privilege('anon','public.platform_feature_flags','SELECT') THEN RAISE EXCEPTION 'Governancedata is onveilig leesbaar';END IF;
END $$;
ROLLBACK;
