-- Uitvoeren na 20260908030000_agency_workspace_members.sql.
-- Controleert Agencybrede interne toegang en reisgebonden klanttoegang.
BEGIN;

CREATE TEMP TABLE agency_access_ids AS SELECT
  gen_random_uuid() owner_id, gen_random_uuid() advisor_id,
  gen_random_uuid() finance_id, gen_random_uuid() client_id,
  gen_random_uuid() trip_one, gen_random_uuid() trip_two;
GRANT SELECT ON agency_access_ids TO authenticated;

INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM agency_access_ids
UNION ALL SELECT advisor_id, advisor_id::TEXT || '@example.invalid', now() FROM agency_access_ids
UNION ALL SELECT finance_id, finance_id::TEXT || '@example.invalid', now() FROM agency_access_ids
UNION ALL SELECT client_id, client_id::TEXT || '@example.invalid', now() FROM agency_access_ids;
INSERT INTO public.workspaces(user_id,plan) SELECT owner_id,'agency' FROM agency_access_ids;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at)
SELECT workspace.workspace_uuid, ids.advisor_id, 'advisor','active',now()
FROM agency_access_ids ids JOIN public.workspaces workspace ON workspace.user_id=ids.owner_id
UNION ALL
SELECT workspace.workspace_uuid, ids.finance_id, 'finance','active',now()
FROM agency_access_ids ids JOIN public.workspaces workspace ON workspace.user_id=ids.owner_id;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name)
SELECT owner_id,trip_one::TEXT,trip_one,'Agencyreis één' FROM agency_access_ids
UNION ALL SELECT owner_id,trip_two::TEXT,trip_two,'Agencyreis twee' FROM agency_access_ids;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
SELECT owner_id,trip_one::TEXT,trip_one,'client-test',client_id,'Klant',client_id::TEXT||'@example.invalid','client','active',now()
FROM agency_access_ids;
INSERT INTO public.trip_expenses(workspace_user_id,trip_id,trip_uuid,id,expense_date,title,category,amount,currency,paid_by,billable,split_with)
SELECT owner_id,trip_one::TEXT,trip_one,'expense-test',current_date,'Test','other',10,'EUR','Eigenaar',false,'[]'::JSONB
FROM agency_access_ids;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',advisor_id::TEXT,true) FROM agency_access_ids;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.trips) <> 2 THEN RAISE EXCEPTION 'Adviseur ziet niet alle Agency-reizen'; END IF;
  IF (SELECT count(*) FROM public.trip_expenses) <> 1 THEN RAISE EXCEPTION 'Adviseur mist financiële reisdata'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',finance_id::TEXT,true) FROM agency_access_ids;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.trips) <> 2 THEN RAISE EXCEPTION 'Financiën ziet niet alle Agency-reizen'; END IF;
  IF (SELECT count(*) FROM public.trip_expenses) <> 1 THEN RAISE EXCEPTION 'Financiën mist uitgaven'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',client_id::TEXT,true) FROM agency_access_ids;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.trips) <> 1 THEN RAISE EXCEPTION 'Klanttoegang is niet tot één reis begrensd'; END IF;
  IF (SELECT count(*) FROM public.trip_expenses) <> 0 THEN RAISE EXCEPTION 'Klant kan financiële data lezen'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
