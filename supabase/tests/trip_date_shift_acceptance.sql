-- Uitvoeren na 20260908169000_trip_date_shift_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'trip.date-shift'
      AND label_nl LIKE '%impactpreview%'
      AND label_en LIKE '%unchanged expenses%'
  ) THEN
    RAISE EXCEPTION 'TRIP_DATE_SHIFT_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
