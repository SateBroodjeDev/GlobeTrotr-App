BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('billing.paddle-account-diagnosis','Betaling en recht',
  'Controleer eenmalige en maandelijkse Paddle-transactie tegen klant, workspace, recht en webhook; herstel alleen toegestaan event',
  'Compare one-time and recurring Paddle transactions with customer, workspace, access and webhook; retry only an eligible event',225)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();
COMMIT;
