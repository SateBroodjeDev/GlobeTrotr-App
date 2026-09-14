BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('trip.insights','Reizen','Reisstatistieken, categorie-uitgaven, daggemiddelde en budgetprognose met toekomstige en lopende reis controleren','Verify trip insights, category spending, daily average and budget forecast for upcoming and active trips',319)
ON CONFLICT(item_key) DO UPDATE SET
 category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
 position=EXCLUDED.position,updated_at=now();

COMMIT;
