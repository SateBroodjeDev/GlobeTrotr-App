BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES(
  'trip.gpx-import',
  'Reizen',
  'Importeer een veilig GPX-bestand met maximaal 500 punten, controleer preview, selectie, dubbelen, routevolgorde en mobiele weergave',
  'Import a safe GPX file with up to 500 points and verify preview, selection, duplicates, route order and mobile layout',
  164
)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,
  updated_at=now();

COMMIT;
