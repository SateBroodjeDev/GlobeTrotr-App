BEGIN;

ALTER TABLE public.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_invitation_type_check;
ALTER TABLE public.email_outbox ADD CONSTRAINT email_outbox_invitation_type_check
  CHECK (invitation_type IN ('trip','agency','client_form'));

CREATE TABLE public.agency_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  introduction TEXT CHECK (introduction IS NULL OR char_length(introduction) <= 1000),
  fields JSONB NOT NULL CHECK (jsonb_typeof(fields)='array' AND jsonb_array_length(fields) BETWEEN 1 AND 40),
  retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days BETWEEN 1 AND 730),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);
CREATE INDEX agency_form_templates_workspace_idx ON public.agency_form_templates(workspace_uuid,archived_at,name);

CREATE TABLE public.agency_form_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  template_id UUID REFERENCES public.agency_form_templates(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 140),
  introduction TEXT CHECK (introduction IS NULL OR char_length(introduction)<=1000),
  fields JSONB NOT NULL CHECK (jsonb_typeof(fields)='array' AND jsonb_array_length(fields) BETWEEN 1 AND 40),
  locale TEXT NOT NULL CHECK (locale IN ('nl','en')),
  expires_at TIMESTAMPTZ NOT NULL,
  retention_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  CHECK (expires_at > created_at),
  CHECK (retention_until >= expires_at)
);
CREATE INDEX agency_form_requests_workspace_idx ON public.agency_form_requests(workspace_uuid,created_at DESC);

CREATE TABLE public.agency_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.agency_form_requests(id) ON DELETE CASCADE,
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  answers JSONB NOT NULL CHECK (jsonb_typeof(answers)='object' AND pg_column_size(answers)<=65536),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','processed','archived')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION private.validate_agency_form_fields(p_fields JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE field JSONB; keys TEXT[]:=ARRAY[]::TEXT[]; key_name TEXT; field_type TEXT;
BEGIN
  IF jsonb_typeof(p_fields)<>'array' OR jsonb_array_length(p_fields) NOT BETWEEN 1 AND 40 THEN RETURN false; END IF;
  FOR field IN SELECT value FROM jsonb_array_elements(p_fields) LOOP
    key_name:=field->>'key';field_type:=field->>'type';
    IF jsonb_typeof(field)<>'object' OR key_name !~ '^[a-z][a-z0-9_]{1,39}$'
      OR key_name=ANY(keys) OR field_type NOT IN ('text','textarea','email','phone','date','number','choice','checkbox')
      OR char_length(COALESCE(field->>'labelNl','')) NOT BETWEEN 1 AND 120
      OR char_length(COALESCE(field->>'labelEn','')) NOT BETWEEN 1 AND 120
      OR COALESCE(field->>'purpose','')='' OR char_length(field->>'purpose')>240
      OR COALESCE(field->>'visibility','') <> 'client'
      OR lower(key_name||' '||COALESCE(field->>'labelNl','')||' '||COALESCE(field->>'labelEn',''))
        ~ '(password|wachtwoord|passkey|pincode|credit.?card|betaalkaart|cvc|cvv|authenticatiecode)' THEN RETURN false; END IF;
    IF field_type='choice' AND (jsonb_typeof(field->'options')<>'array'
      OR jsonb_array_length(field->'options') NOT BETWEEN 1 AND 20) THEN RETURN false; END IF;
    keys:=array_append(keys,key_name);
  END LOOP;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION private.validate_agency_form_template()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.validate_agency_form_fields(NEW.fields) THEN RAISE EXCEPTION 'INVALID_FORM_FIELDS'; END IF;
  NEW.updated_at:=now();RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_agency_form_template() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_agency_form_template BEFORE INSERT OR UPDATE ON public.agency_form_templates
  FOR EACH ROW EXECUTE FUNCTION private.validate_agency_form_template();

CREATE OR REPLACE FUNCTION public.get_public_agency_form(p_token_hash TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request public.agency_form_requests%ROWTYPE; client_name TEXT; brand JSONB;
BEGIN
  SELECT * INTO request FROM public.agency_form_requests WHERE token_hash=p_token_hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  IF request.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status','revoked'); END IF;
  IF request.expires_at<=now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  IF request.submitted_at IS NOT NULL THEN RETURN jsonb_build_object('status','submitted'); END IF;
  SELECT full_name INTO client_name FROM public.agency_clients WHERE id=request.client_id;
  SELECT jsonb_build_object('brandName',COALESCE(NULLIF(settings.system_name,''),'GlobeTrotr Agency'),
    'tagline',COALESCE(settings.tagline,''),'accent',COALESCE(settings.accent,168),
    'logoPath',settings.logo_path) INTO brand
    FROM public.agency_settings settings WHERE settings.workspace_uuid=request.workspace_uuid;
  RETURN jsonb_build_object('status','available','id',request.id,'title',request.title,
    'introduction',COALESCE(request.introduction,''),'fields',request.fields,'locale',request.locale,
    'expiresAt',request.expires_at,'clientName',client_name,'branding',COALESCE(brand,'{}'::JSONB));
END $$;

CREATE OR REPLACE FUNCTION public.submit_public_agency_form(p_token_hash TEXT,p_answers JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request public.agency_form_requests%ROWTYPE; field JSONB; key_name TEXT; answer JSONB;
BEGIN
  SELECT * INTO request FROM public.agency_form_requests WHERE token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND OR request.revoked_at IS NOT NULL THEN RETURN 'unavailable'; END IF;
  IF request.expires_at<=now() THEN RETURN 'expired'; END IF;
  IF request.submitted_at IS NOT NULL THEN RETURN 'submitted'; END IF;
  IF jsonb_typeof(p_answers)<>'object' OR pg_column_size(p_answers)>65536 THEN RETURN 'invalid'; END IF;
  FOR field IN SELECT value FROM jsonb_array_elements(request.fields) LOOP
    key_name:=field->>'key';answer:=p_answers->key_name;
    IF COALESCE((field->>'required')::BOOLEAN,false) AND (answer IS NULL OR answer='null'::JSONB
      OR (jsonb_typeof(answer)='string' AND btrim(answer#>>'{}')='')) THEN RETURN 'invalid'; END IF;
    IF answer IS NOT NULL AND jsonb_typeof(answer)='string' AND char_length(answer#>>'{}')>4000 THEN RETURN 'invalid'; END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_answers) supplied
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(request.fields) field WHERE field->>'key'=supplied))
    THEN RETURN 'invalid'; END IF;
  INSERT INTO public.agency_form_responses(request_id,workspace_uuid,answers)
    VALUES(request.id,request.workspace_uuid,p_answers);
  UPDATE public.agency_form_requests SET submitted_at=now() WHERE id=request.id;
  INSERT INTO public.agency_audit_log(workspace_uuid,action,target_type,target_id,context)
    VALUES(request.workspace_uuid,'client_form.submit','client_form',request.id::TEXT,
      jsonb_build_object('clientId',request.client_id,'tripId',request.trip_uuid));
  RETURN 'submitted';
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_agency_form_data(p_now TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM public.agency_form_requests request WHERE request.retention_until<=p_now;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count;
END $$;

ALTER TABLE public.agency_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_form_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_form_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_form_templates,public.agency_form_requests,public.agency_form_responses FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.agency_form_templates,public.agency_form_requests,public.agency_form_responses TO service_role;
REVOKE ALL ON FUNCTION private.validate_agency_form_fields(JSONB),public.get_public_agency_form(TEXT),public.submit_public_agency_form(TEXT,JSONB),public.cleanup_expired_agency_form_data(TIMESTAMPTZ) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_agency_form(TEXT),public.submit_public_agency_form(TEXT,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_agency_form_data(TIMESTAMPTZ) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('agency.client-forms','Agency','Klantformulieren: test Agency-isolatie, veldvalidatie, mail/link, intrekken/verlopen, mobiel invullen, eenmalig indienen, review, verwerken, archiveren en audit','Client forms: test Agency isolation, field validation, email/link, revoke/expiry, mobile completion, one-time submission, review, processing, archiving and audit',475)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst,'reload schema';
COMMIT;
