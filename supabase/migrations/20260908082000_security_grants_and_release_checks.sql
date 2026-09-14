BEGIN;
REVOKE ALL ON FUNCTION public.list_public_trip_cards() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_trip(TEXT,TEXT,TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_trip_branding(TEXT,TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_platform_status() FROM authenticated;
REVOKE ALL ON FUNCTION public.list_public_testimonials() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_trip_cards() TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip(TEXT,TEXT,TEXT) TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip_branding(TEXT,TEXT) TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_public_platform_status() TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.list_public_testimonials() TO anon,service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('security.quote-isolation','Beveiliging','Offerteprijzen tussen twee verschillende Agencies op isolatie controleren','Verify quote pricing isolation between two different agencies',1001),
('security.exports-and-quota','Beveiliging','CSV-formulebeveiliging en ingelogde vluchtquota praktisch controleren','Verify CSV formula protection and authenticated flight quotas',1002),
('security.member-privacy','Beveiliging','Controleren dat reisgenoten geen e-mailadressen van andere deelnemers kunnen uitlezen','Verify trip members cannot read other participants email addresses',1003),
('public.dynamic-content','Publiek','Publieke reizen, recensies, navigatie en Europese privacyuitleg controleren','Verify public trips, testimonials, navigation and European privacy information',106),
('public.about','Publiek','Over GlobeTrotr, oprichtersverhaal en actuele productstatussen controleren','Verify About GlobeTrotr, founder story and current product statuses',107),
('trip.usability','Reizen','Instellingensecties, gescheiden planning en uitgavenfilters op desktop en mobiel controleren','Verify settings sections, separated planning and expense filters on desktop and mobile',550),
('content.translation-provider','Communicatie','Vertaalprovider configureren en NL-EN-concept met handmatige controle testen','Configure the translation provider and test an NL-EN draft with manual review',810)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';
COMMIT;
