-- Agency-subdomeinen, eigen domeinen en veilige mailafzenderconfiguratie.
-- SMTP-wachtwoorden blijven buiten de database in de latere VPS secret store.
-- Uitvoeren na 20260908062000_agency_suppliers.sql.
BEGIN;
CREATE TABLE public.agency_domains(
 workspace_uuid UUID PRIMARY KEY REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 subdomain TEXT UNIQUE CHECK(subdomain IS NULL OR subdomain ~ '^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$'),
 custom_domain TEXT UNIQUE CHECK(custom_domain IS NULL OR custom_domain ~ '^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])$'),
 verification_token UUID NOT NULL DEFAULT gen_random_uuid(),verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN('pending','verified','failed')),
 verified_at TIMESTAMPTZ,updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(subdomain IS NOT NULL OR custom_domain IS NOT NULL)
);
CREATE TABLE public.agency_mail_settings(
 workspace_uuid UUID PRIMARY KEY REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 from_name TEXT NOT NULL CHECK(char_length(from_name) BETWEEN 1 AND 60),from_email TEXT NOT NULL CHECK(char_length(from_email)<=254),
 reply_to TEXT CHECK(reply_to IS NULL OR char_length(reply_to)<=254),smtp_secret_ref TEXT CHECK(smtp_secret_ref IS NULL OR smtp_secret_ref ~ '^agency/[0-9a-f-]{36}/smtp$'),
 verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN('pending','verified','failed')),updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.save_agency_delivery_settings(p_actor UUID,p_workspace UUID,p_domain JSONB,p_mail JSONB) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_sub TEXT:=NULLIF(lower(btrim(p_domain->>'subdomain')),'');v_custom TEXT:=NULLIF(lower(btrim(p_domain->>'customDomain')),'');v_name TEXT:=NULLIF(btrim(p_mail->>'fromName'),'');v_email TEXT:=NULLIF(lower(btrim(p_mail->>'fromEmail')),'');v_reply TEXT:=NULLIF(lower(btrim(p_mail->>'replyTo')),'');v_token UUID;
BEGIN
 IF NOT private.agency_actor_has_permission(p_workspace,p_actor,'branding_manage') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';END IF;
 IF v_sub IN('www','app','api','admin','dashboard','mail','smtp','status','support','help','cdn','assets','auth','login') OR (v_sub IS NULL AND v_custom IS NULL) OR v_name IS NULL OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR (v_reply IS NOT NULL AND v_reply !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_AGENCY_DELIVERY_SETTINGS';END IF;
 INSERT INTO public.agency_domains(workspace_uuid,subdomain,custom_domain,updated_by) VALUES(p_workspace,v_sub,v_custom,p_actor)
 ON CONFLICT(workspace_uuid) DO UPDATE SET subdomain=EXCLUDED.subdomain,custom_domain=EXCLUDED.custom_domain,verification_status=CASE WHEN agency_domains.subdomain IS DISTINCT FROM EXCLUDED.subdomain OR agency_domains.custom_domain IS DISTINCT FROM EXCLUDED.custom_domain THEN 'pending' ELSE agency_domains.verification_status END,verified_at=CASE WHEN agency_domains.subdomain IS DISTINCT FROM EXCLUDED.subdomain OR agency_domains.custom_domain IS DISTINCT FROM EXCLUDED.custom_domain THEN NULL ELSE agency_domains.verified_at END,verification_token=CASE WHEN agency_domains.subdomain IS DISTINCT FROM EXCLUDED.subdomain OR agency_domains.custom_domain IS DISTINCT FROM EXCLUDED.custom_domain THEN gen_random_uuid() ELSE agency_domains.verification_token END,updated_by=p_actor,updated_at=now() RETURNING verification_token INTO v_token;
 INSERT INTO public.agency_mail_settings(workspace_uuid,from_name,from_email,reply_to,updated_by) VALUES(p_workspace,v_name,v_email,v_reply,p_actor)
 ON CONFLICT(workspace_uuid) DO UPDATE SET from_name=EXCLUDED.from_name,from_email=EXCLUDED.from_email,reply_to=EXCLUDED.reply_to,verification_status=CASE WHEN agency_mail_settings.from_email IS DISTINCT FROM EXCLUDED.from_email THEN 'pending' ELSE agency_mail_settings.verification_status END,updated_by=p_actor,updated_at=now();
 RETURN jsonb_build_object('verificationToken',v_token,'status','pending');
END $$;
ALTER TABLE public.agency_domains ENABLE ROW LEVEL SECURITY;ALTER TABLE public.agency_mail_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_domains,public.agency_mail_settings FROM PUBLIC,anon,authenticated;GRANT ALL ON public.agency_domains,public.agency_mail_settings TO service_role;
REVOKE ALL ON FUNCTION public.save_agency_delivery_settings(UUID,UUID,JSONB,JSONB) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.save_agency_delivery_settings(UUID,UUID,JSONB,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';COMMIT;
