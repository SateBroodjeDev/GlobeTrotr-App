BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('trip.duplicate','Reizen','Reis dupliceren en controleren dat planning wel meegaat maar deelnemers, uitgaven, boekingsreferenties, PIN en openbare status niet','Duplicate a trip and verify planning is copied while members, expenses, booking references, PIN and public status are not',320)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
 label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
