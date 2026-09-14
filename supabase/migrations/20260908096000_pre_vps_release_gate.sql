BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('release.pre-vps','Release','Volledige pre-VPS productacceptatie uitvoeren en alle afwijkingen registreren','Complete full pre-VPS product acceptance and record every deviation',123)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
