-- Uitvoeren na 20260908042000_agency_templates.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE template_test_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() advisor_id,gen_random_uuid() finance_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id;
GRANT SELECT ON template_test_ids TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id,'template-owner@example.invalid',now() FROM template_test_ids UNION ALL SELECT advisor_id,'template-advisor@example.invalid',now() FROM template_test_ids UNION ALL SELECT finance_id,'template-finance@example.invalid',now() FROM template_test_ids UNION ALL SELECT outsider_id,'template-outsider@example.invalid',now() FROM template_test_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM template_test_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at) SELECT workspace_id,advisor_id,'advisor','active',now() FROM template_test_ids UNION ALL SELECT workspace_id,finance_id,'finance','active',now() FROM template_test_ids;
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions) SELECT workspace_id,'advisor','{"trips_view":true,"trips_plan":true}'::JSONB FROM template_test_ids UNION ALL SELECT workspace_id,'finance','{"trips_view":true,"trips_plan":false}'::JSONB FROM template_test_ids ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',advisor_id::TEXT,true) FROM template_test_ids;
INSERT INTO public.agency_templates(workspace_uuid,name,template_type,content,created_by,updated_by) SELECT workspace_id,'Standaard paklijst','packing','["Paspoort","Oplader"]'::JSONB,advisor_id,advisor_id FROM template_test_ids;
DO $$ BEGIN IF(SELECT count(*) FROM public.agency_templates)<>1 THEN RAISE EXCEPTION 'Adviseur kon sjabloon niet maken';END IF;END $$;
SELECT set_config('request.jwt.claim.sub',finance_id::TEXT,true) FROM template_test_ids;
DO $$ DECLARE template_id UUID;BEGIN IF(SELECT count(*) FROM public.agency_templates)<>1 THEN RAISE EXCEPTION 'Finance kan sjablonen niet lezen';END IF;SELECT id INTO template_id FROM public.agency_templates;UPDATE public.agency_templates SET name='Onbevoegd' WHERE id=template_id;IF EXISTS(SELECT 1 FROM public.agency_templates WHERE id=template_id AND name='Onbevoegd')THEN RAISE EXCEPTION 'Finance kon sjabloon wijzigen';END IF;END $$;
SELECT set_config('request.jwt.claim.sub',outsider_id::TEXT,true) FROM template_test_ids;
DO $$ BEGIN IF(SELECT count(*) FROM public.agency_templates)<>0 THEN RAISE EXCEPTION 'Sjabloon lekt naar buitenstaander';END IF;END $$;
RESET ROLE;
DO $$ DECLARE workspace UUID;BEGIN SELECT workspace_id INTO workspace FROM template_test_ids;BEGIN INSERT INTO public.agency_templates(workspace_uuid,name,template_type,content)VALUES(workspace,'Ongeldig','packing','[""]'::JSONB);RAISE EXCEPTION 'Leeg sjabloonitem geaccepteerd';EXCEPTION WHEN check_violation THEN NULL;END;END $$;
ROLLBACK;
