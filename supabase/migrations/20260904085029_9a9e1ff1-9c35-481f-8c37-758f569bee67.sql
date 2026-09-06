DROP POLICY IF EXISTS "Shared workspaces are publicly readable" ON public.workspaces;
REVOKE SELECT ON public.workspaces FROM anon;
GRANT ALL ON public.workspaces TO service_role;