-- Relationele Agency-instellingen, veilige standaardwaarden en logo-opslag.
-- Uitvoeren na 20260908031000_agency_team_management.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agency_settings (
  workspace_uuid UUID PRIMARY KEY REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  system_name TEXT NOT NULL DEFAULT 'GlobeTrotr Agency' CHECK (char_length(system_name) BETWEEN 1 AND 50),
  sender_name TEXT NOT NULL DEFAULT 'GlobeTrotr Agency' CHECK (char_length(sender_name) BETWEEN 1 AND 60),
  contact_email TEXT NOT NULL CHECK (contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  default_locale TEXT NOT NULL DEFAULT 'nl' CHECK (default_locale IN ('nl','en')),
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam' CHECK (char_length(timezone) BETWEEN 1 AND 50),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
  domain TEXT NOT NULL DEFAULT 'globetrotr.nl' CHECK (char_length(domain) BETWEEN 1 AND 120),
  tagline TEXT NOT NULL DEFAULT 'Plan elke reis. Verantwoord elke euro.' CHECK (char_length(tagline) BETWEEN 1 AND 120),
  accent SMALLINT NOT NULL DEFAULT 172 CHECK (accent BETWEEN 0 AND 360),
  logo_path TEXT CHECK (logo_path IS NULL OR char_length(logo_path) BETWEEN 3 AND 300),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.agency_settings(workspace_uuid, system_name, sender_name, contact_email, default_locale, timezone, currency, domain, tagline, accent, updated_by)
SELECT workspace.workspace_uuid,
  left(COALESCE(NULLIF(btrim(workspace.branding->>'brandName'), ''), 'GlobeTrotr Agency'), 50),
  left(COALESCE(NULLIF(btrim(workspace.branding->>'brandName'), ''), 'GlobeTrotr Agency'), 60),
  COALESCE(auth_user.email, 'info@globetrotr.nl'), 'nl', 'Europe/Amsterdam',
  COALESCE(NULLIF(workspace.base_currency, ''), 'EUR'),
  left(COALESCE(NULLIF(btrim(workspace.branding->>'domain'), ''), 'globetrotr.nl'), 120),
  left(COALESCE(NULLIF(btrim(workspace.branding->>'tagline'), ''), 'Plan elke reis. Verantwoord elke euro.'), 120),
  CASE WHEN COALESCE(workspace.branding->>'accent','') ~ '^\d{1,3}$'
    THEN LEAST(360, GREATEST(0, (workspace.branding->>'accent')::INTEGER)) ELSE 172 END, workspace.user_id
FROM public.workspaces AS workspace JOIN auth.users AS auth_user ON auth_user.id=workspace.user_id
WHERE workspace.plan='agency' ON CONFLICT (workspace_uuid) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_agency_settings(p_owner_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_email TEXT; v_row public.agency_settings%ROWTYPE;
BEGIN
  SELECT workspace.workspace_uuid, auth_user.email INTO v_workspace, v_email
  FROM public.workspaces AS workspace JOIN auth.users AS auth_user ON auth_user.id=workspace.user_id
  WHERE workspace.user_id=p_owner_id AND workspace.plan='agency';
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.agency_settings(workspace_uuid, contact_email, updated_by)
  VALUES(v_workspace, v_email, p_owner_id) ON CONFLICT(workspace_uuid) DO NOTHING;
  SELECT * INTO v_row FROM public.agency_settings WHERE workspace_uuid=v_workspace;
  RETURN jsonb_build_object('systemName',v_row.system_name,'senderName',v_row.sender_name,'contactEmail',v_row.contact_email,
    'defaultLocale',v_row.default_locale,'timezone',v_row.timezone,'currency',v_row.currency,'domain',v_row.domain,
    'tagline',v_row.tagline,'accent',v_row.accent,'logoPath',v_row.logo_path);
END $$;

CREATE OR REPLACE FUNCTION public.save_agency_settings(p_owner_id UUID, p_settings JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_workspace UUID; v_current public.agency_settings%ROWTYPE; v_restored TEXT[]='{}'; v_name TEXT; v_sender TEXT; v_domain TEXT; v_tagline TEXT; v_timezone TEXT;
BEGIN
  SELECT workspace_uuid INTO v_workspace FROM public.workspaces WHERE user_id=p_owner_id AND plan='agency' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;
  PERFORM public.get_agency_settings(p_owner_id);
  SELECT * INTO v_current FROM public.agency_settings WHERE workspace_uuid=v_workspace FOR UPDATE;
  v_name:=NULLIF(btrim(p_settings->>'systemName'),''); IF v_name IS NULL THEN v_name:='GlobeTrotr Agency'; v_restored:=array_append(v_restored,'systemName'); END IF;
  v_sender:=NULLIF(btrim(p_settings->>'senderName'),''); IF v_sender IS NULL THEN v_sender:=v_name; v_restored:=array_append(v_restored,'senderName'); END IF;
  v_domain:=COALESCE(NULLIF(lower(btrim(p_settings->>'domain')),''),'globetrotr.nl');
  v_tagline:=COALESCE(NULLIF(btrim(p_settings->>'tagline'),''),'Plan elke reis. Verantwoord elke euro.');
  v_timezone:=COALESCE(NULLIF(btrim(p_settings->>'timezone'),''),'Europe/Amsterdam');
  IF char_length(v_name)>50 OR char_length(v_sender)>60 OR char_length(v_domain)>120 OR char_length(v_tagline)>120 OR char_length(v_timezone)>50 THEN RAISE EXCEPTION 'AGENCY_FIELD_TOO_LONG'; END IF;
  IF COALESCE(p_settings->>'contactEmail','') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_settings->>'defaultLocale' NOT IN ('nl','en') OR COALESCE(p_settings->>'currency','') !~ '^[A-Z]{3}$' OR COALESCE((p_settings->>'accent')::INTEGER,-1) NOT BETWEEN 0 AND 360 THEN RAISE EXCEPTION 'INVALID_AGENCY_SETTINGS'; END IF;
  IF NULLIF(p_settings->>'logoPath','') IS NOT NULL AND p_settings->>'logoPath' !~ ('^'||v_workspace::TEXT||'/logo(-[0-9]+)?\.(png|jpg|jpeg|webp)$') THEN RAISE EXCEPTION 'INVALID_LOGO_PATH'; END IF;
  UPDATE public.agency_settings SET system_name=v_name,sender_name=v_sender,contact_email=lower(p_settings->>'contactEmail'),default_locale=p_settings->>'defaultLocale',timezone=v_timezone,currency=p_settings->>'currency',domain=v_domain,tagline=v_tagline,accent=(p_settings->>'accent')::INTEGER,logo_path=NULLIF(p_settings->>'logoPath',''),updated_at=now(),updated_by=p_owner_id WHERE workspace_uuid=v_workspace;
  UPDATE public.workspaces SET branding=jsonb_build_object('brandName',v_name,'domain',v_domain,'tagline',v_tagline,'accent',(p_settings->>'accent')::INTEGER,'logoPath',NULLIF(p_settings->>'logoPath','')),base_currency=p_settings->>'currency' WHERE workspace_uuid=v_workspace;
  RETURN jsonb_build_object('ok',true,'restored',to_jsonb(v_restored));
END $$;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('agency-logos','agency-logos',false,2097152,ARRAY['image/png','image/jpeg','image/webp']) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=2097152,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Agency owners manage logos" ON storage.objects;
CREATE POLICY "Agency owners manage logos" ON storage.objects FOR ALL TO authenticated
USING(bucket_id='agency-logos' AND private.workspace_role((storage.foldername(name))[1]::UUID)='owner')
WITH CHECK(bucket_id='agency-logos' AND private.workspace_role((storage.foldername(name))[1]::UUID)='owner');

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_settings FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.agency_settings TO service_role;
REVOKE ALL ON FUNCTION public.get_agency_settings(UUID),public.save_agency_settings(UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_settings(UUID),public.save_agency_settings(UUID,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
