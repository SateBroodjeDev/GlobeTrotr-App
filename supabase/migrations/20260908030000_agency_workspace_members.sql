-- Relationeel fundament voor interne Agency-teams en workspacebrede reisrechten.
-- Uitvoeren na 20260908029000_manage_pending_trip_invitations.sql.
BEGIN;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS workspace_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.workspaces DISABLE TRIGGER USER;
UPDATE public.workspaces SET workspace_uuid = gen_random_uuid() WHERE workspace_uuid IS NULL;
ALTER TABLE public.workspaces ENABLE TRIGGER USER;
ALTER TABLE public.workspaces ALTER COLUMN workspace_uuid SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_workspace_uuid_idx
  ON public.workspaces(workspace_uuid);

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS workspace_uuid UUID;
-- De backfill is technisch en mag geen reiswijzigingsmeldingen of andere
-- user-triggers veroorzaken. Dit voorkomt ook pending trigger events vóór
-- de aansluitende NOT NULL- en foreign-keywijzigingen.
ALTER TABLE public.trips DISABLE TRIGGER USER;
UPDATE public.trips AS trip SET workspace_uuid = workspace.workspace_uuid
FROM public.workspaces AS workspace
WHERE workspace.user_id = trip.workspace_user_id AND trip.workspace_uuid IS NULL;
ALTER TABLE public.trips ENABLE TRIGGER USER;
ALTER TABLE public.trips ALTER COLUMN workspace_uuid SET NOT NULL;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_workspace_uuid_fkey;
ALTER TABLE public.trips ADD CONSTRAINT trips_workspace_uuid_fkey
  FOREIGN KEY (workspace_uuid) REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS trips_workspace_uuid_start_idx
  ON public.trips(workspace_uuid, start_date);

CREATE OR REPLACE FUNCTION private.set_trip_workspace_uuid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  SELECT workspace.workspace_uuid INTO NEW.workspace_uuid
  FROM public.workspaces AS workspace WHERE workspace.user_id = NEW.workspace_user_id;
  IF NEW.workspace_uuid IS NULL THEN RAISE EXCEPTION 'Workspace niet gevonden.'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trips_set_workspace_uuid ON public.trips;
CREATE TRIGGER trips_set_workspace_uuid BEFORE INSERT OR UPDATE OF workspace_user_id
ON public.trips FOR EACH ROW EXECUTE FUNCTION private.set_trip_workspace_uuid();

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'advisor', 'finance')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_uuid, user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_one_owner_idx
  ON public.workspace_members(workspace_uuid) WHERE role = 'owner' AND status = 'active';
CREATE INDEX IF NOT EXISTS workspace_members_user_status_idx
  ON public.workspace_members(user_id, status);

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('advisor', 'finance')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at),
  CHECK (accepted_at IS NULL OR declined_at IS NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invitations_one_open_email_idx
  ON public.workspace_invitations(workspace_uuid, lower(email))
  WHERE accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL;

INSERT INTO public.workspace_members(workspace_uuid, user_id, role, status, joined_at)
SELECT workspace.workspace_uuid, workspace.user_id, 'owner', 'active', workspace.created_at
FROM public.workspaces AS workspace
ON CONFLICT (workspace_uuid, user_id) DO UPDATE
SET role = 'owner', status = 'active', joined_at = COALESCE(public.workspace_members.joined_at, EXCLUDED.joined_at);

CREATE OR REPLACE FUNCTION private.add_workspace_owner_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.workspace_members(workspace_uuid, user_id, role, status, joined_at)
  VALUES (NEW.workspace_uuid, NEW.user_id, 'owner', 'active', now())
  ON CONFLICT (workspace_uuid, user_id) DO UPDATE SET role = 'owner', status = 'active';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS workspaces_add_owner_member ON public.workspaces;
CREATE TRIGGER workspaces_add_owner_member AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION private.add_workspace_owner_member();

CREATE OR REPLACE FUNCTION private.workspace_role(target_workspace_uuid UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT member.role FROM public.workspace_members AS member
  JOIN public.workspaces AS workspace ON workspace.workspace_uuid = member.workspace_uuid
  WHERE member.workspace_uuid = target_workspace_uuid
    AND member.user_id = (SELECT auth.uid())
    AND member.status = 'active'
    AND workspace.plan = 'agency'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.trip_role(target_trip_uuid UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(
    (SELECT member.role FROM public.trip_members AS member
      WHERE member.trip_uuid = target_trip_uuid AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active' LIMIT 1),
    (SELECT CASE private.workspace_role(trip.workspace_uuid)
      WHEN 'owner' THEN 'owner' WHEN 'advisor' THEN 'advisor'
      WHEN 'finance' THEN 'finance' END
     FROM public.trips AS trip WHERE trip.trip_uuid = target_trip_uuid)
  )
$$;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.workspace_members, public.workspace_invitations TO authenticated;
GRANT ALL ON public.workspace_members, public.workspace_invitations TO service_role;
DROP POLICY IF EXISTS "Agency members read workspace members" ON public.workspace_members;
CREATE POLICY "Agency members read workspace members" ON public.workspace_members
FOR SELECT TO authenticated USING (private.workspace_role(workspace_uuid) IS NOT NULL);
DROP POLICY IF EXISTS "Agency owners read workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Agency owners read workspace invitations" ON public.workspace_invitations
FOR SELECT TO authenticated USING (private.workspace_role(workspace_uuid) = 'owner');
DROP POLICY IF EXISTS "Agency members read workspace" ON public.workspaces;
CREATE POLICY "Agency members read workspace" ON public.workspaces
FOR SELECT TO authenticated USING (private.workspace_role(workspace_uuid) IS NOT NULL);

REVOKE ALL ON FUNCTION private.set_trip_workspace_uuid(), private.add_workspace_owner_member(),
  private.workspace_role(UUID), private.trip_role(UUID) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.workspace_role(UUID), private.trip_role(UUID) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
