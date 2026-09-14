BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.map-layers','Reizen','Plaatsgebonden boekingen en gekoppelde uitgaven op de routekaart controleren','Verify location-based bookings and linked expenses on the route map',121)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
