BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('public.demo-interaction','Publiek','Demo volledig doorlopen en controleren dat alleen fictieve voorbeelddata wordt gebruikt','Complete the demo and verify that it only uses fictional sample data',127),
('public.contact-icons','Publiek','Iconen bij alle zelfhulplinks op Contact controleren','Verify icons for every self-service link on Contact',128),
('ui.signed-in-menu-order','Gebruikservaring','Volgorde Bedrijfsmail, Corporate Admin, Status en Contact controleren','Verify the Company mail, Corporate Admin, Status and Contact order',129),
('trip.cover-settings-layout','Reizen','Omslagfoto, aanbevolen afmetingen en instellingenindeling op telefoon en desktop controleren','Verify the cover photo, recommended dimensions and settings layout on phone and desktop',130)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
