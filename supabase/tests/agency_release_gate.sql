-- Laatste structurele Agency-controle. Uitvoeren na 20260908062000_agency_suppliers.sql.
-- Alleen metadata wordt gelezen; er blijft geen testdata achter.
BEGIN;
DO $$
DECLARE v_table TEXT;v_function TEXT;
BEGIN
 FOREACH v_table IN ARRAY ARRAY['workspace_members','agency_settings','agency_role_permissions','agency_clients','agency_client_trips','agency_audit_log','agency_notification_preferences','trip_documents','agency_tasks','agency_templates','agency_quotes','agency_suppliers','agency_supplier_trips','agency_domains','agency_mail_settings','email_delivery_config','email_outbox'] LOOP
  IF to_regclass('public.'||v_table) IS NULL THEN RAISE EXCEPTION 'Agency-tabel ontbreekt: %',v_table;END IF;
 END LOOP;
 FOREACH v_function IN ARRAY ARRAY[
  'public.save_agency_settings(uuid,jsonb)','public.save_agency_client(uuid,uuid,uuid,jsonb,uuid[])',
  'public.save_agency_supplier(uuid,uuid,uuid,jsonb,uuid[])','public.set_agency_supplier_archived(uuid,uuid,uuid,boolean)',
  'public.save_trip_notification_preferences(uuid,uuid,jsonb)','public.publish_trip_settlement(uuid,uuid,text,text,jsonb)',
  'public.save_agency_delivery_settings(uuid,uuid,jsonb,jsonb)','public.claim_email_outbox(integer)'
 ] LOOP
  IF to_regprocedure(v_function) IS NULL THEN RAISE EXCEPTION 'Agency-functie ontbreekt: %',v_function;END IF;
  IF has_function_privilege('anon',v_function,'EXECUTE') OR has_function_privilege('authenticated',v_function,'EXECUTE') THEN RAISE EXCEPTION 'Browserrol kan serverfunctie uitvoeren: %',v_function;END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'agency_%' AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Agency-tabel zonder RLS gevonden';END IF;
END $$;
ROLLBACK;
