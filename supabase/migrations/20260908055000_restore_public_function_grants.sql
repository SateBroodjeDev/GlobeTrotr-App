-- Herstel functierechten die door latere CREATE OR REPLACE-migraties opnieuw
-- aan authenticated waren toegekend. Publieke reads lopen met de anon-rol.
BEGIN;

REVOKE ALL ON FUNCTION public.get_public_trip(TEXT,TEXT,TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_trip_branding(TEXT,TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_trip(TEXT,TEXT,TEXT) TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip_branding(TEXT,TEXT) TO anon,service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
