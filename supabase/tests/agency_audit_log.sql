-- Uitvoeren na 20260908036000_agency_audit_log.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE agency_audit_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'audit-owner@example.invalid',now() FROM agency_audit_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_audit_ids;
INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id,context)
SELECT workspace_id,owner_id,'client.update','client','client-test','{"fields":["name"]}'::JSONB FROM agency_audit_ids;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.agency_audit_log)<>1 THEN RAISE EXCEPTION 'Agency-auditregel ontbreekt'; END IF;
  IF has_table_privilege('authenticated','public.agency_audit_log','SELECT') THEN RAISE EXCEPTION 'Authenticated mag auditlog niet rechtstreeks lezen'; END IF;
  IF has_table_privilege('service_role','public.agency_audit_log','UPDATE') OR has_table_privilege('service_role','public.agency_audit_log','DELETE') THEN RAISE EXCEPTION 'Agency-auditlog is niet append-only'; END IF;
END $$;
ROLLBACK;
