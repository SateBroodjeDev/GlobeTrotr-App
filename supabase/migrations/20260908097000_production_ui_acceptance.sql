BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('ui.mobile-navigation','Gebruikservaring','Publieke, reis-, Agency- en Corporate Admin-navigatie op 320, 375, 768 en 1440 pixels controleren','Verify public, trip, Agency and Corporate Admin navigation at 320, 375, 768 and 1440 pixels',124),
('ui.touch-targets','Gebruikservaring','Icoonknoppen, formulieren en actierijen op een aanraakscherm controleren','Verify icon buttons, forms and action rows on a touch screen',125),
('content.production-copy','Communicatie','Nederlandse en Engelse productie-, betaal-, fout- en lege teksten volledig controleren','Review all Dutch and English production, payment, error and empty-state copy',126)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
