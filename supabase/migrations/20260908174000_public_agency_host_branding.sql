BEGIN;

-- Agency logos are public brand assets. Upload and mutation remain restricted
-- to the Agency owner by the existing policies.
UPDATE storage.buckets SET public=true WHERE id='agency-logos';
DROP POLICY IF EXISTS "Public reads agency logos" ON storage.objects;
CREATE POLICY "Public reads agency logos" ON storage.objects FOR SELECT TO anon,authenticated
USING(bucket_id='agency-logos');

CREATE OR REPLACE FUNCTION public.get_public_agency_host_branding(p_host TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE v_host TEXT:=lower(trim(trailing '.' FROM btrim(p_host)));v_sub TEXT;v_result JSONB;
BEGIN
 IF char_length(v_host)>253 OR v_host!~'^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' THEN RETURN NULL;END IF;
 IF v_host IN('globetrotr.nl','www.globetrotr.nl','portal.globetrotr.nl','dashboard.globetrotr.nl') THEN RETURN NULL;END IF;
 IF v_host LIKE '%.globetrotr.nl' THEN
  v_sub:=left(v_host,char_length(v_host)-char_length('.globetrotr.nl'));
  IF v_sub!~'^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$' OR v_sub IN('portal','www','dashboard','mail','smtp','status','support','help','cdn','assets','auth','login','app','api','admin') THEN RETURN NULL;END IF;
 END IF;
 SELECT jsonb_build_object('workspaceId',domain.workspace_uuid,'brandName',COALESCE(NULLIF(settings.system_name,''),'Agency portal'),
   'tagline',COALESCE(settings.tagline,''),'accent',COALESCE(settings.accent,172),'logoPath',settings.logo_path,'domain',v_host)
 INTO v_result FROM public.agency_domains domain
 JOIN public.workspaces workspace ON workspace.workspace_uuid=domain.workspace_uuid AND workspace.plan='agency'
 LEFT JOIN public.agency_settings settings ON settings.workspace_uuid=domain.workspace_uuid
 WHERE (v_sub IS NOT NULL AND domain.subdomain=v_sub)
    OR (v_sub IS NULL AND domain.custom_domain=v_host AND domain.verification_status='verified')
 LIMIT 1;
 RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_agency_host_branding(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_agency_host_branding(TEXT) TO anon,authenticated,service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('agency.white-label-host','Agency','Open Agency-domein uitgelogd en ingelogd: eigen naam, logo, kleur en navigatie zonder GlobeTrotr-marketinglinks','Open an Agency domain signed out and signed in: own name, logo, colour and navigation without GlobeTrotr marketing links',460)
ON CONFLICT(item_key)DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
