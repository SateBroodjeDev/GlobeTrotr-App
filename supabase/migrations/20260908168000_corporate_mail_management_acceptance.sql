BEGIN;

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES (
  'corporate.mail-management',
  'Communicatie',
  'Test gearchiveerde bedrijfsmail: meer berichten laden, schermvullend lezen, NL/EN vertalen en als beheerder definitief verwijderen',
  'Test archived company mail: load more messages, read full screen, translate NL/EN and permanently delete as a manager',
  168
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
