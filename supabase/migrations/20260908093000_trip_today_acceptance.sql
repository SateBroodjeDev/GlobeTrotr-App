BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.today','Reizen','Dagoverzicht met planning, boekingen, bestemming, weer, documenten en taken controleren','Verify today view with schedule, bookings, destination, weather, documents and tasks',120)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
