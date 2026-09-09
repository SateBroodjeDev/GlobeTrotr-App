-- Optionele huisstijl per Agency-reis, met terugval naar de Agency-standaard.
-- Uitvoeren na 20260908033000_agency_permission_overrides.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.trip_branding_overrides (
  trip_uuid UUID PRIMARY KEY REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  brand_name TEXT CHECK (brand_name IS NULL OR char_length(brand_name) BETWEEN 1 AND 50),
  domain TEXT CHECK (domain IS NULL OR char_length(domain) BETWEEN 1 AND 120),
  tagline TEXT CHECK (tagline IS NULL OR char_length(tagline) BETWEEN 1 AND 120),
  accent SMALLINT CHECK (accent IS NULL OR accent BETWEEN 0 AND 360),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION private.agency_actor_has_permission(
  target_workspace UUID, actor_id UUID, permission_name TEXT
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT COALESCE((
    SELECT CASE WHEN member.role='owner' THEN true ELSE COALESCE(
      (member.permission_overrides->>permission_name)::BOOLEAN,
      (role.permissions->>permission_name)::BOOLEAN,
      false
    ) END
    FROM public.workspace_members member
    JOIN public.workspaces workspace ON workspace.workspace_uuid=member.workspace_uuid
    LEFT JOIN public.agency_role_permissions role
      ON role.workspace_uuid=member.workspace_uuid AND role.role=member.role
    WHERE member.workspace_uuid=target_workspace AND member.user_id=actor_id
      AND member.status='active' AND workspace.plan='agency'
  ), false)
$$;

CREATE OR REPLACE FUNCTION public.get_trip_branding(p_actor_id UUID, p_trip_uuid UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_row public.trip_branding_overrides%ROWTYPE;
BEGIN
  SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip
  WHERE trip.trip_uuid=p_trip_uuid;
  IF NOT FOUND OR NOT private.agency_actor_has_permission(v_workspace,p_actor_id,'branding_manage') THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_row FROM public.trip_branding_overrides WHERE trip_uuid=p_trip_uuid;
  RETURN jsonb_build_object(
    'enabled',COALESCE(v_row.enabled,false),'brandName',v_row.brand_name,
    'domain',v_row.domain,'tagline',v_row.tagline,'accent',v_row.accent
  );
END $$;

CREATE OR REPLACE FUNCTION public.save_trip_branding(
  p_actor_id UUID, p_trip_uuid UUID, p_branding JSONB
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_enabled BOOLEAN; v_name TEXT; v_domain TEXT; v_tagline TEXT; v_accent INTEGER;
BEGIN
  SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip
  WHERE trip.trip_uuid=p_trip_uuid FOR UPDATE;
  IF NOT FOUND OR NOT private.agency_actor_has_permission(v_workspace,p_actor_id,'branding_manage') THEN
    RETURN false;
  END IF;
  v_enabled:=COALESCE((p_branding->>'enabled')::BOOLEAN,false);
  v_name:=NULLIF(btrim(p_branding->>'brandName'),'');
  v_domain:=NULLIF(lower(btrim(p_branding->>'domain')),'');
  v_tagline:=NULLIF(btrim(p_branding->>'tagline'),'');
  v_accent:=NULLIF(p_branding->>'accent','')::INTEGER;
  IF char_length(v_name)>50 OR char_length(v_domain)>120 OR char_length(v_tagline)>120
    OR (v_accent IS NOT NULL AND v_accent NOT BETWEEN 0 AND 360) THEN
    RAISE EXCEPTION 'INVALID_TRIP_BRANDING';
  END IF;
  INSERT INTO public.trip_branding_overrides(trip_uuid,enabled,brand_name,domain,tagline,accent,updated_by)
  VALUES(p_trip_uuid,v_enabled,v_name,v_domain,v_tagline,v_accent,p_actor_id)
  ON CONFLICT(trip_uuid) DO UPDATE SET enabled=EXCLUDED.enabled,brand_name=EXCLUDED.brand_name,
    domain=EXCLUDED.domain,tagline=EXCLUDED.tagline,accent=EXCLUDED.accent,
    updated_at=now(),updated_by=p_actor_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_trip_branding(p_token TEXT, p_trip_id TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT CASE WHEN override.enabled THEN jsonb_build_object(
    'brandName',COALESCE(override.brand_name,settings.system_name),
    'domain',COALESCE(override.domain,settings.domain),
    'tagline',COALESCE(override.tagline,settings.tagline),
    'accent',COALESCE(override.accent,settings.accent)
  ) ELSE jsonb_build_object(
    'brandName',settings.system_name,'domain',settings.domain,
    'tagline',settings.tagline,'accent',settings.accent
  ) END
  FROM public.trips trip
  JOIN public.workspaces workspace ON workspace.workspace_uuid=trip.workspace_uuid
  JOIN public.agency_settings settings ON settings.workspace_uuid=workspace.workspace_uuid
  LEFT JOIN public.trip_branding_overrides override ON override.trip_uuid=trip.trip_uuid
  WHERE workspace.public_token::TEXT=p_token AND workspace.plan='agency'
    AND (trip.trip_uuid::TEXT=p_trip_id OR trip.id=p_trip_id)
    AND trip.is_public=true AND trip.archived=false
  LIMIT 1
$$;

ALTER TABLE public.trip_branding_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_branding_overrides FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_branding_overrides TO service_role;
REVOKE ALL ON FUNCTION private.agency_actor_has_permission(UUID,UUID,TEXT),public.get_trip_branding(UUID,UUID),public.save_trip_branding(UUID,UUID,JSONB),public.get_public_trip_branding(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_branding(UUID,UUID),public.save_trip_branding(UUID,UUID,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip_branding(TEXT,TEXT) TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
