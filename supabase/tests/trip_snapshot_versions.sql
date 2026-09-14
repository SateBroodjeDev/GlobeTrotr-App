-- Uitvoeren NA 20260907160000_trip_snapshot_versions.sql.
-- Test met twee snapshots (zoals twee tabbladen); alle testdata wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE version_test_ids AS SELECT gen_random_uuid() AS owner_id,
  gen_random_uuid() AS other_id, gen_random_uuid() AS trip_id;
INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM version_test_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM version_test_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Versietest' FROM version_test_ids;

DO $$
DECLARE
  v_owner UUID; v_other UUID; v_id UUID; v_trip JSONB; v_stale JSONB;
  v_revision TEXT; v_backup JSONB;
BEGIN
  SELECT owner_id, other_id, trip_id INTO v_owner, v_other, v_id FROM version_test_ids;
  v_trip := jsonb_build_object('id', v_id::TEXT, 'revision', '0', 'name', 'Eerste wijziging',
    'start', '2026-09-07', 'end', '2026-09-10', 'budget', 100,
    'expenses', jsonb_build_array(jsonb_build_object('id', 'expense-1', 'date', '2026-09-07',
      'title', 'Lunch', 'category', 'food', 'amount', 12, 'currency', 'EUR', 'paidBy', 'Eigenaar')));
  v_stale := v_trip;
  SELECT revision INTO v_revision FROM public.save_trip_snapshot_versioned(v_owner, v_trip);
  IF v_revision <> '1' THEN RAISE EXCEPTION 'Versie moet naar 1 stijgen'; END IF;
  IF (SELECT amount FROM public.trip_expenses WHERE trip_uuid = v_id AND id = 'expense-1') <> 12 THEN
    RAISE EXCEPTION 'Uitgave niet opgeslagen';
  END IF;

  BEGIN
    PERFORM * FROM public.save_trip_snapshot_versioned(v_owner, v_stale || '{"name":"Verouderd"}'::JSONB);
    RAISE EXCEPTION 'Verouderde versie werd geaccepteerd';
  EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL;
  END;
  BEGIN
    PERFORM * FROM public.save_trip_snapshot_versioned(v_owner, v_trip - 'revision');
    RAISE EXCEPTION 'Ontbrekende versie werd geaccepteerd';
  EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL;
  END;
  BEGIN
    PERFORM * FROM public.save_trip_snapshot_versioned(v_other, v_trip);
    RAISE EXCEPTION 'Andere eigenaar werd geaccepteerd';
  EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL;
  END;

  v_trip := jsonb_set(v_trip, '{revision}', to_jsonb(v_revision));
  SELECT data INTO v_backup FROM public.workspaces WHERE user_id = v_owner;
  BEGIN
    PERFORM * FROM public.save_trip_snapshot_versioned(v_owner,
      jsonb_set(v_trip, '{expenses,0,amount}', '"geen getal"'::JSONB));
    RAISE EXCEPTION 'Ongeldige kindrij werd geaccepteerd';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;
  IF (SELECT revision FROM public.trips WHERE trip_uuid = v_id) <> 1
    OR (SELECT amount FROM public.trip_expenses WHERE trip_uuid = v_id AND id = 'expense-1') <> 12
    OR (SELECT data FROM public.workspaces WHERE user_id = v_owner) IS DISTINCT FROM v_backup THEN
    RAISE EXCEPTION 'Mislukte opslag moet parent, kindrijen, versie en backup herstellen';
  END IF;

  SELECT revision INTO v_revision FROM public.save_trip_snapshot_versioned(v_owner,
    jsonb_set(v_trip, '{expenses,0,amount}', '15'::JSONB));
  IF v_revision <> '2' THEN RAISE EXCEPTION 'Tweede geldige opslag mislukt'; END IF;
  IF (SELECT data->'trips'->0->>'revision' FROM public.workspaces WHERE user_id = v_owner) <> '2' THEN
    RAISE EXCEPTION 'Compatibiliteitskopie moet dezelfde versie bewaren';
  END IF;
  BEGIN
    PERFORM public.delete_trip_versioned(v_owner, v_id, '1');
    RAISE EXCEPTION 'Verwijderen met verouderde versie werd geaccepteerd';
  EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL;
  END;
  PERFORM public.delete_trip_versioned(v_owner, v_id, '2');
  BEGIN
    PERFORM * FROM public.save_trip_snapshot_versioned(v_owner, jsonb_set(v_trip, '{revision}', '"2"'::JSONB));
    RAISE EXCEPTION 'Een verwijderd reis-ID werd opnieuw aangemaakt';
  EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.trip_expenses WHERE trip_uuid = v_id) THEN
    RAISE EXCEPTION 'Verwijderen laat kindrijen achter';
  END IF;
  IF has_function_privilege('service_role', 'public.save_trip_snapshot(uuid,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.save_trip_snapshot_versioned(uuid,jsonb)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.delete_trip_versioned(uuid,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Onveilige RPC-uitvoerrechten';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.save_trip_snapshot_versioned(uuid,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Server mist uitvoerrecht';
  END IF;
END;
$$;
ROLLBACK;
