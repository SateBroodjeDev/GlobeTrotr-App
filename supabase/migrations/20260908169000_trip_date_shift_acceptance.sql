BEGIN;

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES (
  'trip.date-shift',
  'Reisplanning',
  'Verschuif een reis vooruit en terug met impactpreview; controleer periode, stops, dagplanning, boekingen, kandidaten en ongewijzigde uitgaven',
  'Shift a trip forward and backward with an impact preview; verify period, stops, itinerary, bookings, candidates and unchanged expenses',
  169
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
