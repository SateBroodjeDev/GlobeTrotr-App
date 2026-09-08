-- Versterk Corporate Admin met een relationele allowlist en append-only auditlog.
BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin','support')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.platform_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 3 AND 100),
  target_type TEXT CHECK (char_length(target_type) <= 50),
  target_id TEXT CHECK (char_length(target_id) <= 200),
  result TEXT NOT NULL CHECK (result IN ('success','failure')),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_audit_created_idx
  ON public.platform_admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_admin_audit_actor_idx
  ON public.platform_admin_audit_log(actor_user_id, created_at DESC);

-- Neem uitsluitend accounts over die al bewust via app_metadata beheerder zijn.
INSERT INTO public.platform_admins(user_id, role, created_by)
SELECT id, 'owner', id
FROM auth.users
WHERE COALESCE((raw_app_meta_data->>'corporate_admin')::BOOLEAN, false)
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins, public.platform_admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_admins, public.platform_admin_audit_log TO service_role;

COMMIT;
