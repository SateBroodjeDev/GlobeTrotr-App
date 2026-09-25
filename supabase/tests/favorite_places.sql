-- Uitvoeren na 20260908177000_favorite_places.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables
   WHERE table_schema='public' AND table_name='favorite_places') THEN
   RAISE EXCEPTION 'FAVORITE_PLACES_TABLE_MISSING';
 END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
   AND tablename='favorite_places')<>3 THEN
   RAISE EXCEPTION 'FAVORITE_PLACES_POLICIES_MISSING';
 END IF;
 IF has_table_privilege('anon','public.favorite_places','SELECT') THEN
   RAISE EXCEPTION 'FAVORITE_PLACES_EXPOSED';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items
   WHERE item_key='trip.favorite-places') THEN
   RAISE EXCEPTION 'FAVORITE_PLACES_ACCEPTANCE_MISSING';
 END IF;
END $$;
ROLLBACK;
