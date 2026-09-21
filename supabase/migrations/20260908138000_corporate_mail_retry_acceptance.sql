BEGIN;

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES (
  'corporate.mail-retry',
  'Communicatie',
  'Een tijdelijk mislukte bedrijfsmail opnieuw aanbieden en controleren dat HTML, handtekening en bijlagen behouden blijven',
  'Retry a temporarily failed company email and verify that HTML, signature and attachments are preserved',
  138
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
