BEGIN;
ALTER TABLE public.trip_journal_entries ADD COLUMN IF NOT EXISTS photo_sizes JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE public.trip_journal_entries DROP CONSTRAINT IF EXISTS trip_journal_photo_sizes_valid;
ALTER TABLE public.trip_journal_entries ADD CONSTRAINT trip_journal_photo_sizes_valid
CHECK(jsonb_typeof(photo_sizes)='object' AND octet_length(photo_sizes::TEXT)<=4096);
CREATE TABLE IF NOT EXISTS public.trip_journal_summaries(
  trip_uuid UUID PRIMARY KEY REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 1 AND 160),
  body TEXT NOT NULL CHECK(char_length(body) BETWEEN 1 AND 20000),
  selected_entry_ids UUID[] NOT NULL DEFAULT '{}'::UUID[] CHECK(cardinality(selected_entry_ids)<=100),
  visibility TEXT NOT NULL DEFAULT 'members' CHECK(visibility IN('private','members','public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_journal_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Journal summary read by audience" ON public.trip_journal_summaries;
CREATE POLICY "Journal summary read by audience" ON public.trip_journal_summaries FOR SELECT TO authenticated
USING(author_id=auth.uid() OR (visibility IN('members','public') AND private.can_view_trip(trip_uuid)));
DROP POLICY IF EXISTS "Trip planners create journal summary" ON public.trip_journal_summaries;
CREATE POLICY "Trip planners create journal summary" ON public.trip_journal_summaries FOR INSERT TO authenticated
WITH CHECK(author_id=auth.uid() AND private.can_plan_trip(trip_uuid));
DROP POLICY IF EXISTS "Authors update journal summary" ON public.trip_journal_summaries;
CREATE POLICY "Authors update journal summary" ON public.trip_journal_summaries FOR UPDATE TO authenticated
USING(author_id=auth.uid() AND private.can_plan_trip(trip_uuid)) WITH CHECK(author_id=auth.uid() AND private.can_plan_trip(trip_uuid));
DROP POLICY IF EXISTS "Authors delete journal summary" ON public.trip_journal_summaries;
CREATE POLICY "Authors delete journal summary" ON public.trip_journal_summaries FOR DELETE TO authenticated
USING(author_id=auth.uid() AND private.can_plan_trip(trip_uuid));
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.journal-completion','Reis','Offline dagboek, gekozen offline foto’s, synchronisatiewachtrij, fotobijschriften en omslag bij upload, reissamenvatting, openbare terugblik en losse PDF testen','Test offline journal, selected offline photos, sync queue, photo captions and cover during upload, trip summary, public travel story and separate PDF',182)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
