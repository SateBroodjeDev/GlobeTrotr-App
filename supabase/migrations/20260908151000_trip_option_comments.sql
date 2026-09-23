BEGIN;

ALTER TABLE public.trip_travel_options
  ADD CONSTRAINT trip_travel_options_trip_uuid_id_key UNIQUE (trip_uuid, id);

CREATE TABLE public.trip_option_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL,
  option_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (trip_uuid, option_id)
    REFERENCES public.trip_travel_options(trip_uuid, id) ON DELETE CASCADE
);

CREATE INDEX trip_option_comments_option_created_idx
  ON public.trip_option_comments(trip_uuid, option_id, created_at);

ALTER TABLE public.trip_option_comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_option_comments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.trip_option_comments TO authenticated;
GRANT ALL ON public.trip_option_comments TO service_role;

CREATE POLICY "Trip members read option comments" ON public.trip_option_comments
  FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));

CREATE POLICY "Trip members add own option comments" ON public.trip_option_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND (SELECT private.can_view_trip(trip_uuid)));

CREATE POLICY "Authors remove own option comments" ON public.trip_option_comments
  FOR DELETE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND (SELECT private.can_view_trip(trip_uuid)));

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES (
  'trip.option-comments', 'Reizen',
  'Reisvergelijker: reacties per kandidaat met twee actieve reisleden testen; eigen reactie verwijderen, tekstgrens, afwijzing van vreemde reis en cascade bij kandidaatverwijdering controleren',
  'Trip comparison: test comments per candidate with two active trip members; verify own-comment deletion, text limit, denial for another trip and cascade on candidate deletion',
  471
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
