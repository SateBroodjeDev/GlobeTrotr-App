-- Uitvoeren na 20260908038000_agency_notification_preferences.sql.
-- Controleert de volledige effectieve Agency-matrix en reisbegrenzing. Alles wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE agency_matrix_ids AS SELECT gen_random_uuid() owner_id,
  gen_random_uuid() advisor_id,gen_random_uuid() custom_id,gen_random_uuid() finance_id,
  gen_random_uuid() client_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id,
  gen_random_uuid() trip_one,gen_random_uuid() trip_two;
GRANT SELECT ON agency_matrix_ids TO authenticated;

INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id,'matrix-owner@example.invalid',now() FROM agency_matrix_ids UNION ALL
SELECT advisor_id,'matrix-advisor@example.invalid',now() FROM agency_matrix_ids UNION ALL
SELECT custom_id,'matrix-custom@example.invalid',now() FROM agency_matrix_ids UNION ALL
SELECT finance_id,'matrix-finance@example.invalid',now() FROM agency_matrix_ids UNION ALL
SELECT client_id,'matrix-client@example.invalid',now() FROM agency_matrix_ids UNION ALL
SELECT outsider_id,'matrix-outsider@example.invalid',now() FROM agency_matrix_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data)
SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_matrix_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)
SELECT workspace_id,owner_id,'owner','active',now(),'{}'::JSONB FROM agency_matrix_ids ON CONFLICT DO NOTHING;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)
SELECT workspace_id,advisor_id,'advisor','active',now(),'{}'::JSONB FROM agency_matrix_ids UNION ALL
SELECT workspace_id,custom_id,'advisor','active',now(),' {"trips_plan":false,"members_manage":true}'::JSONB FROM agency_matrix_ids UNION ALL
SELECT workspace_id,finance_id,'finance','active',now(),'{}'::JSONB FROM agency_matrix_ids;
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions)
SELECT workspace_id,'advisor','{"trips_view":true,"trips_create":true,"trips_plan":true,"expenses_manage":true,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB FROM agency_matrix_ids UNION ALL
SELECT workspace_id,'finance','{"trips_view":true,"trips_create":false,"trips_plan":false,"expenses_manage":true,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB FROM agency_matrix_ids
ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions;
INSERT INTO public.trips(workspace_user_id,workspace_uuid,id,trip_uuid,name)
SELECT owner_id,workspace_id,trip_one::TEXT,trip_one,'Matrixreis één' FROM agency_matrix_ids UNION ALL
SELECT owner_id,workspace_id,trip_two::TEXT,trip_two,'Matrixreis twee' FROM agency_matrix_ids;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
SELECT owner_id,trip_one::TEXT,trip_one,'matrix-client',client_id,'Klant','matrix-client@example.invalid','client','active',now() FROM agency_matrix_ids;

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub',owner_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; permission TEXT; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  FOREACH permission IN ARRAY ARRAY['trips_view','trips_create','trips_plan','expenses_manage','trip_settings_manage','members_manage','analytics_view','branding_manage','billing_manage']
  LOOP IF NOT private.workspace_has_permission(workspace,permission) THEN RAISE EXCEPTION 'Eigenaar mist recht %',permission; END IF; END LOOP;
END $$;

SELECT set_config('request.jwt.claim.sub',advisor_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  IF NOT private.workspace_has_permission(workspace,'trips_plan') OR NOT private.workspace_has_permission(workspace,'expenses_manage') THEN RAISE EXCEPTION 'Adviseur mist standaard reisrechten'; END IF;
  IF private.workspace_has_permission(workspace,'members_manage') OR private.workspace_has_permission(workspace,'billing_manage') THEN RAISE EXCEPTION 'Adviseur kreeg beheerrechten'; END IF;
  IF (SELECT count(*) FROM public.trips)<>2 THEN RAISE EXCEPTION 'Adviseur ziet niet alle Agency-reizen'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',custom_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  IF private.workspace_has_permission(workspace,'trips_plan') OR NOT private.workspace_has_permission(workspace,'members_manage') THEN RAISE EXCEPTION 'Persoonlijke afwijkingen zijn niet leidend'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',finance_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  IF NOT private.workspace_has_permission(workspace,'expenses_manage') OR private.workspace_has_permission(workspace,'trips_plan') OR private.workspace_has_permission(workspace,'members_manage') THEN RAISE EXCEPTION 'Finance-matrix klopt niet'; END IF;
  IF (SELECT count(*) FROM public.trips)<>2 THEN RAISE EXCEPTION 'Finance ziet niet alle Agency-reizen'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',client_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; permission TEXT; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  FOREACH permission IN ARRAY ARRAY['trips_view','trips_create','trips_plan','expenses_manage','trip_settings_manage','members_manage','analytics_view','branding_manage','billing_manage']
  LOOP IF private.workspace_has_permission(workspace,permission) THEN RAISE EXCEPTION 'Klant kreeg Agency-recht %',permission; END IF; END LOOP;
  IF (SELECT count(*) FROM public.trips)<>1 THEN RAISE EXCEPTION 'Klant ziet meer dan gekoppelde reis'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub',outsider_id::TEXT,true) FROM agency_matrix_ids;
DO $$ DECLARE workspace UUID; BEGIN SELECT workspace_id INTO workspace FROM agency_matrix_ids;
  IF private.workspace_has_permission(workspace,'trips_view') OR (SELECT count(*) FROM public.trips)<>0 THEN RAISE EXCEPTION 'Buitenstaander kreeg Agency-toegang'; END IF;
END $$;

RESET ROLE;
ROLLBACK;
