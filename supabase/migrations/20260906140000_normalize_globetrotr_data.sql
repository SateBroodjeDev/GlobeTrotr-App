-- GlobeTrotr: relationele basis + veilige migratie vanuit workspaces.data.
--
-- Uitvoeren in Lovable Cloud / Supabase SQL Editor als één migratie.
-- De bestaande JSON in public.workspaces.data wordt NIET verwijderd.
-- Maak vóór productiegebruik altijd een database-back-up/export.

BEGIN;

-- 1. Accountprofiel: bestaande tabel uitbreiden, geen nieuwe gebruikers maken.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'nl-NL',
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('system', 'light', 'dark')),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Privé profielfoto's: alleen de eigenaar kan bestanden in zijn/haar map lezen.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own avatars" ON storage.objects;
CREATE POLICY "Users read own avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Workspace-instellingen los trekken uit het JSON-document.
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'agency')),
  ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_migrated_at TIMESTAMPTZ;

UPDATE public.workspaces
SET
  plan = COALESCE(NULLIF(data->>'plan', ''), plan, 'free'),
  base_currency = COALESCE(NULLIF(data->>'baseCurrency', ''), base_currency, 'EUR'),
  branding = CASE
    WHEN jsonb_typeof(data->'branding') = 'object' THEN data->'branding'
    ELSE branding
  END
WHERE data IS NOT NULL;

-- 3. Hoofdentiteit: één rij per reis.
CREATE TABLE IF NOT EXISTS public.trips (
  workspace_user_id UUID NOT NULL REFERENCES public.workspaces(user_id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'citytrip',
  start_date DATE,
  end_date DATE,
  budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  travelers JSONB NOT NULL DEFAULT '[]'::jsonb,
  archived BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_financials BOOLEAN NOT NULL DEFAULT false,
  share_pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_user_id, id),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS trips_workspace_start_idx
  ON public.trips(workspace_user_id, start_date);
CREATE INDEX IF NOT EXISTS trips_public_idx
  ON public.trips(is_public) WHERE is_public = true;

-- 4. Lijsten uit de JSON-reis krijgen ieder een eigen tabel.
CREATE TABLE IF NOT EXISTS public.trip_stops (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  arrive_date DATE,
  nights INTEGER,
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.trip_itinerary_items (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  day DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS trip_itinerary_day_idx
  ON public.trip_itinerary_items(workspace_user_id, trip_id, day, position);

CREATE TABLE IF NOT EXISTS public.trip_expenses (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  expense_date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  paid_by TEXT NOT NULL DEFAULT '',
  billable BOOLEAN NOT NULL DEFAULT false,
  split_with JSONB NOT NULL DEFAULT '[]'::jsonb,
  receipt_path TEXT,
  receipt_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS trip_expenses_date_idx
  ON public.trip_expenses(workspace_user_id, trip_id, expense_date);

CREATE TABLE IF NOT EXISTS public.trip_travel_items (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('flight', 'lodging', 'transport', 'activity')),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  provider TEXT,
  booking_reference TEXT,
  flight_number TEXT,
  flight_status TEXT,
  departure JSONB,
  arrival JSONB,
  location JSONB,
  amount NUMERIC(14,2),
  currency TEXT,
  expense_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.trip_packing_items (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.trip_members (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'traveler', 'viewer', 'advisor', 'finance', 'client')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS trip_members_email_idx
  ON public.trip_members(lower(email));
CREATE INDEX IF NOT EXISTS trip_members_user_idx
  ON public.trip_members(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.trip_documents (
  workspace_user_id UUID NOT NULL,
  trip_id TEXT NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  travel_item_id TEXT,
  expense_id TEXT,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  document_type TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_user_id, trip_id, id),
  FOREIGN KEY (workspace_user_id, trip_id)
    REFERENCES public.trips(workspace_user_id, id) ON DELETE CASCADE
);

-- Houd updated_at bijgewerkt met de bestaande helper uit de initiële migratie.
DROP TRIGGER IF EXISTS trips_set_updated_at ON public.trips;
CREATE TRIGGER trips_set_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trip_expenses_set_updated_at ON public.trip_expenses;
CREATE TRIGGER trip_expenses_set_updated_at
  BEFORE UPDATE ON public.trip_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trip_travel_items_set_updated_at ON public.trip_travel_items;
CREATE TRIGGER trip_travel_items_set_updated_at
  BEFORE UPDATE ON public.trip_travel_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Bestaande JSON-data kopiëren. Herhaald uitvoeren is veilig door ON CONFLICT.
INSERT INTO public.trips (
  workspace_user_id, id, name, template, start_date, end_date, budget,
  travelers, archived, is_public, share_financials, share_pin_hash
)
SELECT
  workspace.user_id,
  trip->>'id',
  COALESCE(NULLIF(trip->>'name', ''), 'Naamloze reis'),
  COALESCE(NULLIF(trip->>'template', ''), 'citytrip'),
  NULLIF(trip->>'start', '')::DATE,
  NULLIF(trip->>'end', '')::DATE,
  COALESCE(NULLIF(trip->>'budget', '')::NUMERIC, 0),
  COALESCE(trip->'travelers', '[]'::jsonb),
  COALESCE(NULLIF(trip->>'archived', '')::BOOLEAN, false),
  COALESCE(NULLIF(trip->>'public', '')::BOOLEAN, false),
  COALESCE(NULLIF(trip->>'shareFinancials', '')::BOOLEAN, false),
  NULLIF(trip->>'sharePinHash', '')
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
WHERE trip ? 'id'
ON CONFLICT (workspace_user_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  template = EXCLUDED.template,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  budget = EXCLUDED.budget,
  travelers = EXCLUDED.travelers,
  archived = EXCLUDED.archived,
  is_public = EXCLUDED.is_public,
  share_financials = EXCLUDED.share_financials,
  share_pin_hash = EXCLUDED.share_pin_hash;

INSERT INTO public.trip_stops (
  workspace_user_id, trip_id, id, position, name, country, lat, lon, arrive_date, nights
)
SELECT workspace.user_id, trip->>'id', stop->>'id', stop_ordinality - 1,
  COALESCE(NULLIF(stop->>'name', ''), 'Onbekende locatie'),
  COALESCE(stop->>'country', ''),
  COALESCE(NULLIF(stop->>'lat', '')::DOUBLE PRECISION, 0),
  COALESCE(NULLIF(stop->>'lon', '')::DOUBLE PRECISION, 0),
  NULLIF(stop->>'arrive', '')::DATE,
  NULLIF(stop->>'nights', '')::INTEGER
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'stops', '[]'::jsonb)) WITH ORDINALITY AS stops(stop, stop_ordinality)
WHERE trip ? 'id' AND stop ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

INSERT INTO public.trip_itinerary_items (
  workspace_user_id, trip_id, id, day, title, notes, position
)
SELECT workspace.user_id, trip->>'id', item->>'id',
  NULLIF(item->>'day', '')::DATE,
  COALESCE(NULLIF(item->>'title', ''), 'Onderdeel'),
  NULLIF(item->>'notes', ''), item_ordinality - 1
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'itinerary', '[]'::jsonb)) WITH ORDINALITY AS items(item, item_ordinality)
WHERE trip ? 'id' AND item ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

INSERT INTO public.trip_expenses (
  workspace_user_id, trip_id, id, expense_date, title, category, amount, currency,
  paid_by, billable, split_with, receipt_path, receipt_name
)
SELECT workspace.user_id, trip->>'id', expense->>'id',
  NULLIF(expense->>'date', '')::DATE,
  COALESCE(NULLIF(expense->>'title', ''), 'Uitgave'),
  COALESCE(NULLIF(expense->>'category', ''), 'other'),
  COALESCE(NULLIF(expense->>'amount', '')::NUMERIC, 0),
  COALESCE(NULLIF(expense->>'currency', ''), 'EUR'),
  COALESCE(expense->>'paidBy', ''),
  COALESCE(NULLIF(expense->>'billable', '')::BOOLEAN, false),
  COALESCE(expense->'splitWith', '[]'::jsonb),
  NULLIF(expense->>'receiptPath', ''),
  NULLIF(expense->>'receiptName', '')
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'expenses', '[]'::jsonb)) AS expense
WHERE trip ? 'id' AND expense ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

INSERT INTO public.trip_travel_items (
  workspace_user_id, trip_id, id, item_type, title, start_date, end_date, provider,
  booking_reference, flight_number, flight_status, departure, arrival, location,
  amount, currency, expense_id, notes
)
SELECT workspace.user_id, trip->>'id', item->>'id',
  COALESCE(NULLIF(item->>'type', ''), 'activity'),
  COALESCE(NULLIF(item->>'title', ''), 'Reisonderdeel'),
  NULLIF(item->>'date', '')::DATE,
  NULLIF(item->>'endDate', '')::DATE,
  NULLIF(item->>'provider', ''), NULLIF(item->>'bookingReference', ''),
  NULLIF(item->>'flightNumber', ''), NULLIF(item->>'flightStatus', ''),
  item->'departure', item->'arrival', item->'location',
  NULLIF(item->>'amount', '')::NUMERIC, NULLIF(item->>'currency', ''),
  NULLIF(item->>'expenseId', ''), NULLIF(item->>'notes', '')
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'travelItems', '[]'::jsonb)) AS item
WHERE trip ? 'id' AND item ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

INSERT INTO public.trip_packing_items (workspace_user_id, trip_id, id, label, done, position)
SELECT workspace.user_id, trip->>'id', item->>'id',
  COALESCE(NULLIF(item->>'label', ''), 'Paklijstitem'),
  COALESCE(NULLIF(item->>'done', '')::BOOLEAN, false), item_ordinality - 1
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'packing', '[]'::jsonb)) WITH ORDINALITY AS items(item, item_ordinality)
WHERE trip ? 'id' AND item ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

INSERT INTO public.trip_members (
  workspace_user_id, trip_id, id, name, email, role, status, invited_at
)
SELECT workspace.user_id, trip->>'id', member->>'id',
  COALESCE(NULLIF(member->>'name', ''), 'Reisgenoot'),
  COALESCE(NULLIF(member->>'email', ''), 'unknown@example.invalid'),
  COALESCE(NULLIF(member->>'role', ''), 'traveler'),
  COALESCE(NULLIF(member->>'status', ''), 'invited'),
  COALESCE(NULLIF(member->>'invitedAt', '')::TIMESTAMPTZ, now())
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(trip->'members', '[]'::jsonb)) AS member
WHERE trip ? 'id' AND member ? 'id'
ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;

UPDATE public.workspaces SET data_migrated_at = now()
WHERE data_migrated_at IS NULL;

-- 6. Rechten: voorlopig kan alleen de eigenaar eigen data lezen/schrijven.
-- Een latere migratie voegt per-reis rechten toe zodra uitnodigingen echte Auth-users koppelen.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips, public.trip_stops,
  public.trip_itinerary_items, public.trip_expenses, public.trip_travel_items,
  public.trip_packing_items, public.trip_members, public.trip_documents TO authenticated;
GRANT ALL ON public.trips, public.trip_stops, public.trip_itinerary_items,
  public.trip_expenses, public.trip_travel_items, public.trip_packing_items,
  public.trip_members, public.trip_documents TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_travel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own trips" ON public.trips;
CREATE POLICY "Owners manage own trips" ON public.trips
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own trip stops" ON public.trip_stops;
CREATE POLICY "Owners manage own trip stops" ON public.trip_stops
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own itinerary" ON public.trip_itinerary_items;
CREATE POLICY "Owners manage own itinerary" ON public.trip_itinerary_items
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own trip expenses" ON public.trip_expenses;
CREATE POLICY "Owners manage own trip expenses" ON public.trip_expenses
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own travel items" ON public.trip_travel_items;
CREATE POLICY "Owners manage own travel items" ON public.trip_travel_items
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own packing items" ON public.trip_packing_items;
CREATE POLICY "Owners manage own packing items" ON public.trip_packing_items
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own trip members" ON public.trip_members;
CREATE POLICY "Owners manage own trip members" ON public.trip_members
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own trip documents" ON public.trip_documents;
CREATE POLICY "Owners manage own trip documents" ON public.trip_documents
  FOR ALL TO authenticated
  USING (workspace_user_id = auth.uid())
  WITH CHECK (workspace_user_id = auth.uid());

COMMIT;
