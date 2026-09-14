-- Configureerbare Agency-rolrechten met optionele afwijkingen per teamlid.
-- Uitvoeren na 20260908032000_agency_settings_and_logo.sql.
BEGIN;

ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS permission_overrides JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_permission_overrides_check;

CREATE TABLE IF NOT EXISTS public.agency_role_permissions(
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN('advisor','finance')),
  permissions JSONB NOT NULL CHECK(jsonb_typeof(permissions)='object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY(workspace_uuid,role)
);
INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions)
SELECT workspace.workspace_uuid, role.name, role.permissions FROM public.workspaces workspace CROSS JOIN (VALUES
 ('advisor','{"trips_view":true,"trips_create":true,"trips_plan":true,"expenses_manage":true,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB),
 ('finance','{"trips_view":true,"trips_create":false,"trips_plan":false,"expenses_manage":true,"trip_settings_manage":false,"members_manage":false,"analytics_view":true,"branding_manage":false,"billing_manage":false}'::JSONB)
) role(name,permissions) WHERE workspace.plan='agency' ON CONFLICT(workspace_uuid,role) DO NOTHING;

CREATE OR REPLACE FUNCTION private.valid_agency_permissions(value JSONB, allow_partial BOOLEAN) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT jsonb_typeof(value)='object' AND NOT EXISTS(SELECT 1 FROM jsonb_each(value) entry WHERE entry.key NOT IN('trips_view','trips_create','trips_plan','expenses_manage','trip_settings_manage','members_manage','analytics_view','branding_manage','billing_manage') OR jsonb_typeof(entry.value)<>'boolean') AND (allow_partial OR (SELECT count(*)=9 FROM jsonb_object_keys(value))) $$;
ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_permission_overrides_check
  CHECK(private.valid_agency_permissions(permission_overrides,true));

CREATE OR REPLACE FUNCTION public.get_agency_permissions(p_owner_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_workspace UUID; BEGIN
 SELECT workspace_uuid INTO v_workspace FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency'; IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('workspaceId',v_workspace,'roles',COALESCE((SELECT jsonb_object_agg(role,permissions) FROM public.agency_role_permissions WHERE workspace_uuid=v_workspace),'{}'::JSONB),'members',COALESCE((SELECT jsonb_agg(jsonb_build_object('userId',member.user_id,'role',member.role,'overrides',member.permission_overrides)) FROM public.workspace_members member WHERE member.workspace_uuid=v_workspace AND member.role<>'owner'),'[]'::JSONB));
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_role_permissions(p_owner_id UUID,p_role TEXT,p_permissions JSONB) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_workspace UUID; BEGIN
 SELECT workspace_uuid INTO v_workspace FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency';
 IF NOT FOUND OR p_role NOT IN('advisor','finance') OR NOT private.valid_agency_permissions(p_permissions,false) THEN RETURN false; END IF;
 INSERT INTO public.agency_role_permissions(workspace_uuid,role,permissions,updated_by) VALUES(v_workspace,p_role,p_permissions,p_owner_id) ON CONFLICT(workspace_uuid,role) DO UPDATE SET permissions=EXCLUDED.permissions,updated_at=now(),updated_by=p_owner_id; RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_member_permissions(p_owner_id UUID,p_member_user_id UUID,p_overrides JSONB) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_workspace UUID; BEGIN
 SELECT workspace_uuid INTO v_workspace FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency';
 IF NOT FOUND OR p_member_user_id=p_owner_id OR NOT private.valid_agency_permissions(p_overrides,true) THEN RETURN false; END IF;
 UPDATE public.workspace_members SET permission_overrides=p_overrides,updated_at=now() WHERE workspace_uuid=v_workspace AND user_id=p_member_user_id AND role<>'owner'; RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION private.workspace_has_permission(target_workspace_uuid UUID,permission_name TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT COALESCE((SELECT CASE WHEN member.role='owner' THEN true ELSE COALESCE((member.permission_overrides->>permission_name)::BOOLEAN,(role.permissions->>permission_name)::BOOLEAN,false) END FROM public.workspace_members member JOIN public.workspaces workspace ON workspace.workspace_uuid=member.workspace_uuid LEFT JOIN public.agency_role_permissions role ON role.workspace_uuid=member.workspace_uuid AND role.role=member.role WHERE member.workspace_uuid=target_workspace_uuid AND member.user_id=(SELECT auth.uid()) AND member.status='active' AND workspace.plan='agency'),false)
$$;

ALTER TABLE public.agency_role_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_role_permissions FROM PUBLIC,anon,authenticated; GRANT ALL ON public.agency_role_permissions TO service_role;
REVOKE ALL ON FUNCTION private.valid_agency_permissions(JSONB,BOOLEAN),private.workspace_has_permission(UUID,TEXT),public.get_agency_permissions(UUID),public.save_agency_role_permissions(UUID,TEXT,JSONB),public.save_agency_member_permissions(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_permissions(UUID),public.save_agency_role_permissions(UUID,TEXT,JSONB),public.save_agency_member_permissions(UUID,UUID,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION private.workspace_has_permission(UUID,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema'; COMMIT;
