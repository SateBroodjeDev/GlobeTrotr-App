-- GlobeTrotr: persoonlijke tijdzone voor datums, meldingen en toekomstige exports.
--
-- Voer dit script uit in Lovable Cloud / Supabase SQL Editor voordat je de
-- tijdzonekeuze in productie gebruikt. Bestaande accounts behouden veilig
-- Europe/Amsterdam als standaard.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam';

UPDATE public.profiles
SET timezone = 'Europe/Amsterdam'
WHERE timezone IS NULL OR btrim(timezone) = '';

COMMIT;
