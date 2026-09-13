-- Uitvoeren na 20260908015000_security_hardening.sql.
-- Controleert quota, afgeschermde leden-e-mails en SECURITY DEFINER-rechten.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE security_test_ids AS
SELECT gen_random_uuid() AS owner_id, gen_random_uuid() AS member_id,
  gen_random_uuid() AS trip_id;
GRANT SELECT ON security_test_ids TO authenticated;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, owner_id::TEXT || '@example.invalid', now() FROM security_test_ids
UNION ALL
SELECT member_id, member_id::TEXT || '@example.invalid', now() FROM security_test_ids;
INSERT INTO public.workspaces(user_id) SELECT owner_id FROM security_test_ids;
INSERT INTO public.trips(workspace_user_id, id, trip_uuid, name)
SELECT owner_id, trip_id::TEXT, trip_id, 'Securitytest' FROM security_test_ids;
INSERT INTO public.trip_members(
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, email, role, status
)
SELECT owner_id, trip_id::TEXT, trip_id, 'security-member', member_id,
  'Testlid', 'gevoelig@example.invalid', 'traveler', 'active'
FROM security_test_ids;

DO $$
DECLARE v_owner UUID;
BEGIN
  SELECT owner_id INTO v_owner FROM security_test_ids;
  IF NOT public.consume_flight_lookup_quota(v_owner, 2)
    OR NOT public.consume_flight_lookup_quota(v_owner, 2)
    OR public.consume_flight_lookup_quota(v_owner, 2) THEN
    RAISE EXCEPTION 'Vluchtquotum staat niet exact twee controles toe';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', member_id::TEXT, true) FROM security_test_ids;
DO $$
DECLARE v_unsafe TEXT;
BEGIN
  IF (SELECT count(*) FROM public.trip_members) < 1 THEN
    RAISE EXCEPTION 'Reislid kan de veilige ledenlijst niet lezen';
  END IF;
  BEGIN
    PERFORM email FROM public.trip_members LIMIT 1;
    RAISE EXCEPTION 'Reislid kan e-mailadressen nog rechtstreeks lezen';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated kan handle_new_user rechtstreeks uitvoeren';
  END IF;
  IF has_function_privilege(
    'authenticated', 'public.consume_flight_lookup_quota(uuid,integer)', 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Authenticated kan het vluchtquotum rechtstreeks omzeilen';
  END IF;
  IF has_column_privilege('authenticated','public.trip_members','email','SELECT') THEN
    RAISE EXCEPTION 'Authenticated heeft nog direct kolomrecht op leden-e-mails';
  END IF;
  SELECT string_agg(p.oid::regprocedure::TEXT,', ' ORDER BY p.oid::regprocedure::TEXT)
  INTO v_unsafe FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef AND n.nspname = 'public'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      ;
  IF v_unsafe IS NOT NULL THEN
    RAISE EXCEPTION 'Authenticated kan nog publieke SECURITY DEFINER-functies uitvoeren: %',v_unsafe;
  END IF;
  SELECT string_agg(p.oid::regprocedure::TEXT,', ' ORDER BY p.oid::regprocedure::TEXT)
  INTO v_unsafe FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef AND n.nspname = 'public'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND p.proname NOT IN ('list_public_trip_cards','get_public_trip','get_public_trip_branding','get_public_platform_status','list_public_testimonials');
  IF v_unsafe IS NOT NULL THEN
    RAISE EXCEPTION 'Anon kan niet-goedgekeurde SECURITY DEFINER-functies uitvoeren: %',v_unsafe;
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
