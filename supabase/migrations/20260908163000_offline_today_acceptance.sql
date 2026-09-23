BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('trip.offline-today','Reis','Bewaar een reis expliciet offline, voeg een uitgave toe zonder netwerk, synchroniseer bewust en wis het pakket bij uitloggen','Explicitly save a trip offline, add an expense without a network, sync explicitly and clear the pack on sign-out',163)
ON CONFLICT (item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
