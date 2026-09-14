BEGIN;

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES (
  'public.production-privacy',
  'Betaling en recht',
  'Live privacy- en cookieverklaring controleren op Hetzner, Supabase, ZXCS, Turnstile, OAuth en gebruikte browseropslag',
  'Review the live privacy and cookie notice for Hetzner, Supabase, ZXCS, Turnstile, OAuth and browser storage in use',
  211
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
