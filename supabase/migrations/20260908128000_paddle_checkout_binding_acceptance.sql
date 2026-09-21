BEGIN;

INSERT INTO public.release_checklist_items
  (item_key, category, label_nl, label_en, position)
VALUES (
  'billing.paddle-checkout-binding', 'Betaling en recht',
  'Controleer dat een checkout alleen de aangemelde workspace activeert en een gewijzigde browser-workspace-ID geen recht verleent',
  'Verify checkout activates only the signed-in workspace and a changed browser workspace ID grants no access',
  233
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
