-- Uitvoeren na 20260907234000_restrict_trip_financials.sql.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE financial_privacy_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS viewer_id,
  gen_random_uuid() AS finance_id, gen_random_uuid() AS trip_id;

-- De test schakelt later naar de database-rol `authenticated`. Geef die rol
-- alleen leesrecht op de tijdelijke UUID's die nodig zijn om de JWT-claim te
-- wisselen. De tabel en dit recht verdwijnen automatisch bij ROLLBACK.
GRANT SELECT ON financial_privacy_ids TO authenticated;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM financial_privacy_ids
UNION ALL
SELECT viewer_id, viewer_id::TEXT || '@example.invalid', now() FROM financial_privacy_ids
UNION ALL
SELECT finance_id, finance_id::TEXT || '@example.invalid', now() FROM financial_privacy_ids;

INSERT INTO public.workspaces(user_id)
SELECT owner_id FROM financial_privacy_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Privacytest' FROM financial_privacy_ids;
INSERT INTO public.trip_members(
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, email, role, status
)
SELECT owner_id, trip_id::TEXT, trip_id, 'viewer-test', viewer_id, 'Viewer',
  viewer_id::TEXT || '@example.invalid', 'viewer', 'active' FROM financial_privacy_ids
UNION ALL
SELECT owner_id, trip_id::TEXT, trip_id, 'finance-test', finance_id, 'Finance',
  finance_id::TEXT || '@example.invalid', 'finance', 'active' FROM financial_privacy_ids;
INSERT INTO public.trip_expenses(
  workspace_user_id, trip_id, trip_uuid, id, expense_date, title, category,
  amount, currency, paid_by, billable, split_with
)
SELECT owner_id, trip_id::TEXT, trip_id, 'private-expense', current_date,
  'Privé-uitgave', 'other', 42, 'EUR', 'Eigenaar', false, '[]'::JSONB
FROM financial_privacy_ids;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', viewer_id::TEXT, true) FROM financial_privacy_ids;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trips) <> 1 THEN
    RAISE EXCEPTION 'Viewer moet de gedeelde reis kunnen lezen';
  END IF;
  IF (SELECT count(*) FROM public.trip_expenses) <> 0 THEN
    RAISE EXCEPTION 'Viewer mag geen financiële gegevens lezen';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', finance_id::TEXT, true) FROM financial_privacy_ids;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trip_expenses) <> 1 THEN
    RAISE EXCEPTION 'Finance moet financiële gegevens kunnen lezen';
  END IF;
END;
$$;

RESET ROLE;
ROLLBACK;
