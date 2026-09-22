BEGIN;

CREATE TABLE public.trip_travel_options (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  id TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('flight','lodging','transport','car_rental','activity')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  start_date DATE NOT NULL,
  end_date DATE,
  provider TEXT CHECK (provider IS NULL OR char_length(provider) <= 120),
  amount NUMERIC(14,2) CHECK (amount IS NULL OR amount >= 0),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  charges_included BOOLEAN NOT NULL DEFAULT false,
  cancellation TEXT CHECK (cancellation IS NULL OR char_length(cancellation) <= 500),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  distance_km NUMERIC(12,2) CHECK (distance_km IS NULL OR distance_km >= 0),
  source_url TEXT CHECK (source_url IS NULL OR (char_length(source_url) <= 2048 AND source_url ~ '^https?://')),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','selected','rejected')),
  checked_at TIMESTAMPTZ,
  converted_travel_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE,
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX trip_travel_options_trip_idx
  ON public.trip_travel_options(trip_uuid,status,start_date);

ALTER TABLE public.trip_travel_options ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_travel_options FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.trip_travel_options TO authenticated;
GRANT ALL ON public.trip_travel_options TO service_role;

CREATE POLICY "Members read travel options" ON public.trip_travel_options
FOR SELECT TO authenticated
USING ((SELECT private.can_view_trip(trip_uuid)));

CREATE POLICY "Planners manage travel options" ON public.trip_travel_options
FOR ALL TO authenticated
USING ((SELECT private.can_plan_trip(trip_uuid)))
WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES (
  'trip.options-comparison',
  'Reizen',
  'Voeg verblijf-, vlucht-, vervoer-, huurauto- en activiteitsopties toe; filter en sorteer op mobiel en desktop; vergelijk maximaal vier; controleer valuta, onbekende toeslagen, bronlink, archiveren, viewerrechten en exact één boeking na kiezen',
  'Add accommodation, flight, transport, rental-car and activity options; filter and sort on mobile and desktop; compare up to four; verify currencies, unknown charges, source link, archiving, viewer access and exactly one booking after choosing',
  470
)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,
  updated_at=now();

COMMIT;
