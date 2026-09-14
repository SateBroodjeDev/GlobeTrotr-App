BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('production.supabase-project','Hosting en productie','Nieuw Supabase-productieproject in een EU-regio aanmaken en uitsluitend met de productieomgeving koppelen','Create a new Supabase production project in an EU region and connect it only to production',920),
('production.database-migrations','Hosting en productie','Alle Git-migraties via Supabase CLI toepassen en de migratiehistorie controleren','Apply all Git migrations through the Supabase CLI and verify migration history',921),
('production.auth-storage','Hosting en productie','Auth-URL’s, e-mail, Storage-buckets, policies en productiegeheimen opnieuw configureren','Reconfigure Auth URLs, email, Storage buckets, policies and production secrets',922),
('production.bootstrap-admin','Hosting en productie','Eerste productieaccount aanmaken, Corporate Admin activeren en met een nieuwe sessie controleren','Create the first production account, enable Corporate Admin and verify it with a new session',923),
('production.staging-fallback','Hosting en productie','Lovable als staging en terugvalomgeving gescheiden houden van productiegegevens','Keep Lovable as a staging and fallback environment separated from production data',924)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
