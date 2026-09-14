BEGIN;

CREATE TABLE public.platform_maintenance(
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK(singleton),
  active BOOLEAN NOT NULL DEFAULT false,
  reason_nl TEXT NOT NULL DEFAULT 'We voeren gepland onderhoud uit.' CHECK(char_length(reason_nl) BETWEEN 10 AND 1000),
  reason_en TEXT NOT NULL DEFAULT 'We are carrying out scheduled maintenance.' CHECK(char_length(reason_en) BETWEEN 10 AND 1000),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at>starts_at)
);
INSERT INTO public.platform_maintenance(singleton) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_maintenance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_maintenance FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_maintenance TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('public.maintenance','Hosting en productie','Onderhoud aanzetten, reden en aftelling controleren, inloggen en Corporate Admin-bypass testen','Enable maintenance, verify reason and countdown, sign-in and Corporate Admin bypass',920),
('account.privacy-request','Accounts en toegang','Privacyverzoek indienen, eigen statusgeschiedenis bekijken en opvolging met deadline in Corporate Admin controleren','Submit a privacy request, view its personal status history and verify follow-up and deadline in Corporate Admin',450),
('corporate.testimonials','Corporate Admin','Recensie met en zonder Engelse tekst opslaan, publiceren, bewerken en archiveren','Save, publish, edit and archive a testimonial with and without English text',730),
('ui.avatars','Accounts en toegang','Vierkante, liggende en staande profielfoto zonder uitrekken controleren','Verify square, landscape and portrait profile pictures without stretching',460),
('public.value-story','Publiek','Homepage, mogelijkheden, demo en Over-pagina op duidelijke koopreden en mobiele leesbaarheid controleren','Verify homepage, features, demo and About page for a clear value proposition and mobile readability',108),
('privacy.server-proxy','Beveiliging','Controleren dat externe providerverzoeken via de server lopen en geen client-IP rechtstreeks delen','Verify external provider requests use the server and do not directly share the client IP',1004)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
