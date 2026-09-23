BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('trip.hotel-gap-discovery','Reisplanning','Ontbrekende hotelnachten, OpenStreetMap-zoekactie en toevoegen aan de Vergelijker controleren','Verify missing hotel nights, OpenStreetMap search and adding a result to Comparison',165)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
