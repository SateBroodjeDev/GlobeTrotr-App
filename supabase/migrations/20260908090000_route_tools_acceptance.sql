BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('trip.route-tools','Reizen','GPX-export openen in een kaartapp en de route tweemaal omkeren zonder bestemmingen te verliezen','Open the GPX export in a mapping app and reverse the route twice without losing destinations',321)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
 label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
