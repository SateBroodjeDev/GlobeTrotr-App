-- GlobeTrotr: bonnetjes zijn een Agency-functie.
--
-- Voer uit na de eerdere GlobeTrotr-migraties. De bestaande bestanden worden
-- niet verwijderd, maar zijn alleen toegankelijk zolang het account Agency
-- als huidig plan heeft. Een echte Stripe/webhook-koppeling is nog nodig om
-- het plan niet langer door de gebruiker zelf wijzigbaar te maken.

BEGIN;

-- Breng de reeds aanwezige JSON-kopie eerst in lijn met de relationele
-- instellingenkolommen. Nieuwe app-writes houden dit daarna ook synchroon.
UPDATE public.workspaces
SET
  plan = CASE
    WHEN data->>'plan' IN ('free', 'pro', 'agency') THEN data->>'plan'
    ELSE plan
  END,
  base_currency = COALESCE(NULLIF(data->>'baseCurrency', ''), base_currency),
  branding = CASE
    WHEN jsonb_typeof(data->'branding') = 'object' THEN data->'branding'
    ELSE branding
  END
WHERE data IS NOT NULL;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.has_agency_plan()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces AS workspace
    WHERE workspace.user_id = (SELECT auth.uid())
      AND workspace.plan = 'agency'
  )
$$;

REVOKE ALL ON FUNCTION private.has_agency_plan() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_agency_plan() TO authenticated;

DROP POLICY IF EXISTS "Users read own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency users read own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency users upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency users update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agency users delete own receipts" ON storage.objects;

CREATE POLICY "Agency users read own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (SELECT private.has_agency_plan())
  );

CREATE POLICY "Agency users upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (SELECT private.has_agency_plan())
  );

CREATE POLICY "Agency users update own receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (SELECT private.has_agency_plan())
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (SELECT private.has_agency_plan())
  );

CREATE POLICY "Agency users delete own receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (SELECT private.has_agency_plan())
  );

COMMIT;
