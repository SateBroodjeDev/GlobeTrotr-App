BEGIN;

CREATE TABLE IF NOT EXISTS public.trip_journal_entries(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  entry_date DATE NOT NULL,
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 1 AND 160),
  body TEXT NOT NULL DEFAULT '' CHECK(char_length(body)<=10000),
  location_name TEXT CHECK(location_name IS NULL OR char_length(location_name)<=160),
  rating SMALLINT CHECK(rating BETWEEN 1 AND 5),
  visibility TEXT NOT NULL DEFAULT 'members' CHECK(visibility IN('private','members','public')),
  photo_path TEXT,
  photo_paths TEXT[] NOT NULL DEFAULT '{}'::TEXT[] CHECK(cardinality(photo_paths)<=8),
  photo_captions JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(jsonb_typeof(photo_captions)='object' AND octet_length(photo_captions::TEXT)<=4096),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS rating SMALLINT;
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS photo_paths TEXT[] NOT NULL DEFAULT '{}'::TEXT[];
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS photo_captions JSONB NOT NULL DEFAULT '{}'::JSONB;
CREATE INDEX IF NOT EXISTS trip_journal_trip_date_idx ON public.trip_journal_entries(trip_uuid,entry_date,id);
ALTER TABLE public.trip_journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Journal entries read by audience" ON public.trip_journal_entries;
CREATE POLICY "Journal entries read by audience" ON public.trip_journal_entries FOR SELECT TO authenticated
USING(author_id=auth.uid() OR (visibility IN('members','public') AND (SELECT private.can_view_trip(trip_uuid))));
DROP POLICY IF EXISTS "Trip planners create journal entries" ON public.trip_journal_entries;
CREATE POLICY "Trip planners create journal entries" ON public.trip_journal_entries FOR INSERT TO authenticated
WITH CHECK(author_id=auth.uid() AND (SELECT private.can_plan_trip(trip_uuid)));
DROP POLICY IF EXISTS "Authors manage journal entries" ON public.trip_journal_entries;
CREATE POLICY "Authors manage journal entries" ON public.trip_journal_entries FOR UPDATE TO authenticated
USING(author_id=auth.uid() AND (SELECT private.can_plan_trip(trip_uuid))) WITH CHECK(author_id=auth.uid() AND (SELECT private.can_plan_trip(trip_uuid)));
DROP POLICY IF EXISTS "Authors delete journal entries" ON public.trip_journal_entries;
CREATE POLICY "Authors delete journal entries" ON public.trip_journal_entries FOR DELETE TO authenticated
USING(author_id=auth.uid() AND (SELECT private.can_plan_trip(trip_uuid)));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('trip-journal','trip-journal',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Trip viewers read journal photos" ON storage.objects;
CREATE POLICY "Trip viewers read journal photos" ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='trip-journal' AND CASE
  WHEN (storage.foldername(name))[1]~*'^[0-9a-f-]{36}$'
    AND (storage.foldername(name))[2]~*'^[0-9a-f-]{36}$'
  THEN EXISTS(
    SELECT 1 FROM public.trip_journal_entries entry
    WHERE entry.trip_uuid=((storage.foldername(name))[1])::UUID
      AND entry.id=((storage.foldername(name))[2])::UUID
      AND (entry.author_id=auth.uid() OR (entry.visibility IN('members','public') AND private.can_view_trip(entry.trip_uuid)))
  ) ELSE false END
);
DROP POLICY IF EXISTS "Trip planners upload journal photos" ON storage.objects;
CREATE POLICY "Trip planners upload journal photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='trip-journal' AND CASE WHEN(storage.foldername(name))[1]~*'^[0-9a-f-]{36}$' THEN private.can_plan_trip(((storage.foldername(name))[1])::UUID) ELSE false END);
DROP POLICY IF EXISTS "Trip planners delete journal photos" ON storage.objects;
CREATE POLICY "Trip planners delete journal photos" ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='trip-journal' AND CASE WHEN(storage.foldername(name))[1]~*'^[0-9a-f-]{36}$' THEN private.can_plan_trip(((storage.foldername(name))[1])::UUID) ELSE false END);

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.journal','Reis','Los reisdagboek met tijdlijn, galerij, routekaart, maximaal acht geordende foto’s, omslag, bijschriften, waardering, auteurschap, zichtbaarheid en afgeschermde opslag testen','Test the separate travel journal with timeline, gallery, route map, up to eight ordered photos, cover, captions, ratings, authorship, visibility and protected storage',180)
ON CONFLICT(item_key) DO UPDATE SET label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,updated_at=now();
COMMIT;
