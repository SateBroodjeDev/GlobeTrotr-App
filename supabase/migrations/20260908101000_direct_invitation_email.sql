BEGIN;

-- Uitnodigingen moeten ook naar personen zonder bestaand account kunnen.
ALTER TABLE public.email_outbox ALTER COLUMN notification_id DROP NOT NULL;
ALTER TABLE public.email_outbox ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('mail.trip-invitation','Communicatie','Reisuitnodiging per e-mail naar bestaand en nieuw account controleren','Verify trip invitation email to an existing and a new account',126),
('mail.agency-invitation','Communicatie','Agency-teamuitnodiging per e-mail en veilige acceptatielink controleren','Verify Agency team invitation email and secure acceptance link',127),
('deployment.independent-runtime','Infrastructuur','Productiebuild zonder Lovable-runtime of Lovable-package controleren','Verify the production build without a Lovable runtime or package',128),
('deployment.brand-library','Publiek','Alle vijf openbare merkassets en donkere variant controleren','Verify all five public brand assets and the dark variant',129)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

DELETE FROM public.release_checklist_items WHERE item_key='production.staging-fallback';

COMMIT;
