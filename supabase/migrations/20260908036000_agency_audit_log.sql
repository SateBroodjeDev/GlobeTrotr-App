-- Append-only auditlog voor beheeracties binnen één Agency-workspace.
-- Uitvoeren na 20260908035000_agency_clients.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agency_audit_log(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK(char_length(action) BETWEEN 3 AND 80),
  target_type TEXT CHECK(target_type IS NULL OR char_length(target_type)<=40),
  target_id TEXT CHECK(target_id IS NULL OR char_length(target_id)<=100),
  context JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(jsonb_typeof(context)='object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_audit_workspace_created_idx
  ON public.agency_audit_log(workspace_uuid,created_at DESC);

-- De auditlog is append-only: uitsluitend de serverrol kan regels toevoegen
-- en lezen. Ook service_role krijgt bewust geen UPDATE- of DELETE-recht.
ALTER TABLE public.agency_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_audit_log FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.agency_audit_log TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
