-- GlobeTrotr: globale reis-ID's en veilige toegang per reis.
--
-- Voer dit pas uit NA 20260906140000_normalize_globetrotr_data.sql.
-- De huidige JSON-kolom public.workspaces.data blijft ongewijzigd. Daardoor
-- blijven bestaande app-sessies werken terwijl de app in een volgende wijziging
-- gecontroleerd naar de relationele tabellen verhuist.
--
-- Deze migratie stopt als een kindrij niet aan precies één bestaande reis kan
-- worden gekoppeld. Maak vóór productiegebruik een back-up/export.

BEGIN;

-- 1. Een globale, onveranderlijke UUID naast de bestaande tijdelijke tekst-ID.
-- De oude id blijft alleen voor de JSON-overgang en de bestaande samengestelde
-- foreign keys bestaan. Nieuwe code moet trip_uuid gebruiken.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_uuid UUID;

UPDATE public.trips
SET trip_uuid = gen_random_uuid()
WHERE trip_uuid IS NULL;

ALTER TABLE public.trips
  ALTER COLUMN trip_uuid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN trip_uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trips_trip_uuid_key ON public.trips (trip_uuid);
CREATE INDEX IF NOT EXISTS trips_owner_trip_uuid_idx
  ON public.trips (workspace_user_id, trip_uuid);
CREATE INDEX IF NOT EXISTS trips_public_trip_uuid_idx
  ON public.trips (trip_uuid)
  WHERE is_public = true AND archived = false;

-- Nieuwe reizen ontvangen de UUID in de database. De bestaande TEXT-kolom
-- krijgt dezelfde UUID-string zolang de oude samengestelde keys nog bestaan.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.assign_trip_identifiers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.trip_uuid IS NULL THEN
    NEW.trip_uuid := gen_random_uuid();
  END IF;
  IF NEW.id IS NULL OR btrim(NEW.id) = '' THEN
    NEW.id := NEW.trip_uuid::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_assign_identifiers ON public.trips;
CREATE TRIGGER trips_assign_identifiers
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION private.assign_trip_identifiers();

-- 2. Geef alle bestaande en toekomstige kindrijen dezelfde globale sleutel.
ALTER TABLE public.trip_stops ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_itinerary_items ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_travel_items ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_packing_items ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS trip_uuid UUID;
ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS trip_uuid UUID;

UPDATE public.trip_stops c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_itinerary_items c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_expenses c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_travel_items c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_packing_items c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_members c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;
UPDATE public.trip_documents c SET trip_uuid = t.trip_uuid
FROM public.trips t
WHERE c.trip_uuid IS NULL
  AND c.workspace_user_id = t.workspace_user_id AND c.trip_id = t.id;

ALTER TABLE public.trip_stops ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_itinerary_items ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_expenses ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_travel_items ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_packing_items ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_members ALTER COLUMN trip_uuid SET NOT NULL;
ALTER TABLE public.trip_documents ALTER COLUMN trip_uuid SET NOT NULL;

DO $$
DECLARE
  child_table TEXT;
BEGIN
  FOREACH child_table IN ARRAY ARRAY[
    'trip_stops', 'trip_itinerary_items', 'trip_expenses', 'trip_travel_items',
    'trip_packing_items', 'trip_members', 'trip_documents'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = child_table || '_trip_uuid_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (trip_uuid) REFERENCES public.trips(trip_uuid) ON DELETE CASCADE',
        child_table, child_table || '_trip_uuid_fkey'
      );
    END IF;
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (trip_uuid)',
      child_table || '_trip_uuid_idx', child_table
    );
  END LOOP;
END;
$$;

-- 3. Reisleden worden de enige bron voor toegang. Maak voor elke bestaande
-- reis een actieve eigenaar aan, zonder handmatige leden te verwijderen.
UPDATE public.trip_members
SET role = 'traveler'
WHERE role = 'owner';

INSERT INTO public.trip_members (
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
  role, status, invited_at, accepted_at
)
SELECT
  t.workspace_user_id,
  t.id,
  t.trip_uuid,
  'owner-' || t.trip_uuid::text,
  t.workspace_user_id,
  COALESCE(NULLIF(p.display_name, ''), split_part(COALESCE(p.email, ''), '@', 1), 'Eigenaar'),
  COALESCE(p.email, 'owner-' || t.trip_uuid::text || '@example.invalid'),
  'owner',
  'active',
  t.created_at,
  t.created_at
FROM public.trips t
LEFT JOIN public.profiles p ON p.id = t.workspace_user_id
ON CONFLICT (workspace_user_id, trip_id, id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    role = 'owner',
    status = 'active',
    accepted_at = COALESCE(public.trip_members.accepted_at, EXCLUDED.accepted_at);

CREATE UNIQUE INDEX IF NOT EXISTS trip_members_one_owner_idx
  ON public.trip_members (trip_uuid) WHERE role = 'owner';
CREATE UNIQUE INDEX IF NOT EXISTS trip_members_active_user_idx
  ON public.trip_members (trip_uuid, user_id)
  WHERE user_id IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS trip_members_trip_status_idx
  ON public.trip_members (trip_uuid, status);

-- Uitnodigingen zijn eigen serverdata; tokens worden alleen als hash bewaard.
CREATE TABLE IF NOT EXISTS public.trip_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('traveler', 'viewer', 'advisor', 'finance', 'client')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS trip_invitations_one_open_email_idx
  ON public.trip_invitations (trip_uuid, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS trip_invitations_token_idx
  ON public.trip_invitations (token_hash);

-- 4. RLS-hulpfuncties. Ze staan in private, met vaste search_path, om
-- policy-recursie te voorkomen en nooit als publieke API te dienen.
CREATE OR REPLACE FUNCTION private.trip_role(target_trip_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.role
  FROM public.trip_members AS m
  WHERE m.trip_uuid = target_trip_uuid
    AND m.user_id = (SELECT auth.uid())
    AND m.status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.can_view_trip(target_trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.trip_role(target_trip_uuid) IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION private.can_plan_trip(target_trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.trip_role(target_trip_uuid) IN ('owner', 'traveler', 'advisor')
$$;

CREATE OR REPLACE FUNCTION private.can_manage_money(target_trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.trip_role(target_trip_uuid) IN ('owner', 'traveler', 'advisor', 'finance')
$$;

CREATE OR REPLACE FUNCTION private.is_trip_owner(target_trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.trip_role(target_trip_uuid) = 'owner'
$$;

REVOKE ALL ON FUNCTION private.trip_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_view_trip(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_plan_trip(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_money(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_trip_owner(UUID) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.trip_role(UUID), private.can_view_trip(UUID),
  private.can_plan_trip(UUID), private.can_manage_money(UUID), private.is_trip_owner(UUID)
  TO authenticated;

-- Eigenaar-lid voor elke nieuwe relationele reis.
CREATE OR REPLACE FUNCTION private.add_trip_owner_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name TEXT;
  owner_email TEXT;
BEGIN
  SELECT p.display_name, p.email INTO display_name, owner_email
  FROM public.profiles p WHERE p.id = NEW.workspace_user_id;

  INSERT INTO public.trip_members (
    workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
    role, status, invited_at, accepted_at
  ) VALUES (
    NEW.workspace_user_id, NEW.id, NEW.trip_uuid,
    'owner-' || NEW.trip_uuid::text, NEW.workspace_user_id,
    COALESCE(NULLIF(display_name, ''), split_part(COALESCE(owner_email, ''), '@', 1), 'Eigenaar'),
    COALESCE(owner_email, 'owner-' || NEW.trip_uuid::text || '@example.invalid'),
    'owner', 'active', now(), now()
  ) ON CONFLICT (workspace_user_id, trip_id, id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_add_owner_member ON public.trips;
CREATE TRIGGER trips_add_owner_member
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION private.add_trip_owner_member();

ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_invitations TO authenticated;
GRANT ALL ON public.trip_invitations TO service_role;

-- Vervang de tijdelijke owner-only policies door expliciete rolrechten.
DROP POLICY IF EXISTS "Owners manage own trips" ON public.trips;
DROP POLICY IF EXISTS "Trip members read trips" ON public.trips;
DROP POLICY IF EXISTS "Users create own trips" ON public.trips;
DROP POLICY IF EXISTS "Planners update trips" ON public.trips;
DROP POLICY IF EXISTS "Owners delete trips" ON public.trips;
CREATE POLICY "Trip members read trips" ON public.trips FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Users create own trips" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (workspace_user_id = (SELECT auth.uid()));
CREATE POLICY "Planners update trips" ON public.trips FOR UPDATE TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));
CREATE POLICY "Owners delete trips" ON public.trips FOR DELETE TO authenticated
  USING ((SELECT private.is_trip_owner(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own trip stops" ON public.trip_stops;
DROP POLICY IF EXISTS "Members read trip stops" ON public.trip_stops;
DROP POLICY IF EXISTS "Planners manage trip stops" ON public.trip_stops;
CREATE POLICY "Members read trip stops" ON public.trip_stops FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners manage trip stops" ON public.trip_stops FOR ALL TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own itinerary" ON public.trip_itinerary_items;
DROP POLICY IF EXISTS "Members read itinerary" ON public.trip_itinerary_items;
DROP POLICY IF EXISTS "Planners manage itinerary" ON public.trip_itinerary_items;
CREATE POLICY "Members read itinerary" ON public.trip_itinerary_items FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners manage itinerary" ON public.trip_itinerary_items FOR ALL TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own trip expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Members read trip expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Money managers manage expenses" ON public.trip_expenses;
CREATE POLICY "Members read trip expenses" ON public.trip_expenses FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Money managers manage expenses" ON public.trip_expenses FOR ALL TO authenticated
  USING ((SELECT private.can_manage_money(trip_uuid)))
  WITH CHECK ((SELECT private.can_manage_money(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own travel items" ON public.trip_travel_items;
DROP POLICY IF EXISTS "Members read travel items" ON public.trip_travel_items;
DROP POLICY IF EXISTS "Planners manage travel items" ON public.trip_travel_items;
CREATE POLICY "Members read travel items" ON public.trip_travel_items FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners manage travel items" ON public.trip_travel_items FOR ALL TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own packing items" ON public.trip_packing_items;
DROP POLICY IF EXISTS "Members read packing" ON public.trip_packing_items;
DROP POLICY IF EXISTS "Planners manage packing" ON public.trip_packing_items;
CREATE POLICY "Members read packing" ON public.trip_packing_items FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners manage packing" ON public.trip_packing_items FOR ALL TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own trip members" ON public.trip_members;
DROP POLICY IF EXISTS "Members read trip members" ON public.trip_members;
DROP POLICY IF EXISTS "Owners manage trip members" ON public.trip_members;
CREATE POLICY "Members read trip members" ON public.trip_members FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Owners manage trip members" ON public.trip_members FOR ALL TO authenticated
  USING ((SELECT private.is_trip_owner(trip_uuid)))
  WITH CHECK ((SELECT private.is_trip_owner(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage own trip documents" ON public.trip_documents;
DROP POLICY IF EXISTS "Members read trip documents" ON public.trip_documents;
DROP POLICY IF EXISTS "Planners manage trip documents" ON public.trip_documents;
CREATE POLICY "Members read trip documents" ON public.trip_documents FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners manage trip documents" ON public.trip_documents FOR ALL TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

DROP POLICY IF EXISTS "Owners manage trip invitations" ON public.trip_invitations;
CREATE POLICY "Owners manage trip invitations" ON public.trip_invitations FOR ALL TO authenticated
  USING ((SELECT private.is_trip_owner(trip_uuid)))
  WITH CHECK (
    (SELECT private.is_trip_owner(trip_uuid))
    AND invited_by = (SELECT auth.uid())
  );

COMMIT;

-- Handmatige controles na uitvoeren (alle aantallen moeten nul zijn):
-- SELECT count(*) AS trips_without_uuid FROM public.trips WHERE trip_uuid IS NULL;
-- SELECT count(*) AS orphan_children FROM public.trip_stops s
--   LEFT JOIN public.trips t ON t.trip_uuid = s.trip_uuid WHERE t.trip_uuid IS NULL;
-- SELECT count(*) AS duplicate_trip_uuids FROM (
--   SELECT trip_uuid FROM public.trips GROUP BY trip_uuid HAVING count(*) > 1
-- ) duplicates;
