-- Uitvoeren na 20260908144000_trip_navigation_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.release_checklist_items
      WHERE item_key IN ('dashboard.focus-trip','trip.mobile-navigation')) <> 2 THEN
    RAISE EXCEPTION 'TRIP_NAVIGATION_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
