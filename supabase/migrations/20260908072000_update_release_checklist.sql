-- Actualiseer de implementatiechecklist na de notificatie- en resetreparaties.
-- Uitvoeren na 20260908071000_fix_trip_change_delete_trigger.sql.
BEGIN;

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES
  (
    'db.migrations', 'Database',
    'Alle migraties tot en met 720 in volgorde uitvoeren',
    'Run all migrations through 720 in order', 10
  ),
  (
    'db.tests', 'Database',
    'Alle SQL-regressietests zonder fout uitvoeren',
    'Run all SQL regression tests without errors', 20
  ),
  (
    'data.clean-start', 'Data',
    'Schone dataset, nieuw eigenaaraccount en Corporate Admin-toegang controleren',
    'Verify the clean dataset, new owner account and Corporate Admin access', 25
  )
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
