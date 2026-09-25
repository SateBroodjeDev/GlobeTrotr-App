BEGIN;

CREATE TABLE public.favorite_places(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(char_length(btrim(name)) BETWEEN 1 AND 120),
  country TEXT NOT NULL DEFAULT '' CHECK(char_length(country)<=100),
  lat DOUBLE PRECISION NOT NULL CHECK(lat BETWEEN -90 AND 90),
  lon DOUBLE PRECISION NOT NULL CHECK(lon BETWEEN -180 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id,name,lat,lon)
);
CREATE INDEX favorite_places_user_created_idx
  ON public.favorite_places(user_id,created_at DESC);

ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.favorite_places FROM PUBLIC,anon;
GRANT SELECT,INSERT,DELETE ON public.favorite_places TO authenticated;
GRANT ALL ON public.favorite_places TO service_role;

CREATE POLICY "Users read own favorite places" ON public.favorite_places
  FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY "Users add own favorite places" ON public.favorite_places
  FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY "Users delete own favorite places" ON public.favorite_places
  FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.favorite-places','Reisplanning',
  'Persoonlijke favoriete plaats opslaan, na herladen terugzien, aan een andere reis toevoegen en verwijderen; controleer tenant- en gebruikersisolatie',
  'Save a personal favourite place, see it after reload, add it to another trip and remove it; verify tenant and user isolation',478)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
