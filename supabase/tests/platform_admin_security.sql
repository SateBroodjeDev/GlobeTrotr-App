-- Uitvoeren na 20260908019000_platform_admins_and_audit.sql.
-- Controleert dat gewone ingelogde gebruikers de beheerallowlist en auditlog niet kunnen lezen.
BEGIN;

CREATE TEMP TABLE platform_admin_test_ids AS SELECT gen_random_uuid() AS user_id;
INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT user_id, user_id::TEXT || '@example.invalid', now() FROM platform_admin_test_ids;
INSERT INTO public.platform_admins(user_id, role, created_by)
SELECT user_id, 'admin', user_id FROM platform_admin_test_ids;
INSERT INTO public.platform_admin_audit_log(actor_user_id, action, target_type, result)
SELECT user_id, 'security.test', 'platform', 'success' FROM platform_admin_test_ids;

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.platform_admins;
    RAISE EXCEPTION 'Authenticated kon platform_admins ten onrechte lezen';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM * FROM public.platform_admin_audit_log;
    RAISE EXCEPTION 'Authenticated kon de auditlog ten onrechte lezen';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
ROLLBACK;
