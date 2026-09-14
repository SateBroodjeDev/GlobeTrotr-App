BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('trip.comparison','Reizen','Twee verschillende reizen vergelijken op periode, route, boekingen, budget en uitgaven; controleer ook mobiel en vreemde valuta','Compare two trips by dates, route, bookings, budget and expenses; also verify mobile layout and foreign currencies',322)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
 label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
