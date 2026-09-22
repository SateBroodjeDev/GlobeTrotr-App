BEGIN;

-- These hosts belong to the platform and must never become Agency aliases.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.agency_domains
    WHERE subdomain IN ('portal','www','dashboard','mail','smtp','status','support','help','cdn','assets','auth','login','app','api','admin')) THEN
    RAISE EXCEPTION 'RESERVED_AGENCY_SUBDOMAIN_EXISTS';
  END IF;
END $$;
ALTER TABLE public.agency_domains
  ADD CONSTRAINT agency_domains_reserved_subdomain
  CHECK (subdomain IS NULL OR subdomain NOT IN
    ('portal','www','dashboard','mail','smtp','status','support','help','cdn','assets','auth','login','app','api','admin'));

UPDATE public.release_checklist_items
SET label_nl='Agency-host: controleer actieve workspace, redirect naar centraal portal, afwijzing voor andere Agency en 404 op overige paden',
    label_en='Agency host: verify active workspace, redirect to central portal, denial for another Agency and 404 on other paths',
    updated_at=now()
WHERE item_key='agency.domain-tenant-binding';

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('agency.portal-entry','Agency',
  'Agency-domein: alleen geregistreerde actieve Agency-host stuurt door naar het juiste portal; ander account krijgt geen toegang',
  'Agency domain: only a registered active Agency host redirects to the right portal; another account is denied',459)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
