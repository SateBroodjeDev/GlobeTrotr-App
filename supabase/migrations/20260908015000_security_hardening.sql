-- Verhelp beveiligingsmeldingen rond API-quota, leden-e-mails en functierechten.
-- Uitvoeren na 20260908014000_public_trip_weather.sql.
BEGIN;

-- Directe tabelreads mogen alleen niet-gevoelige ledenvelden teruggeven.
-- De server gebruikt service_role en kan voor de eigenaar nog steeds e-mails laden.
REVOKE SELECT ON public.trip_members FROM authenticated;
GRANT SELECT (
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, role,
  status, invited_at, accepted_at
) ON public.trip_members TO authenticated;

-- Eén teller per account en UTC-uur. Alleen de geauthenticeerde serverfunctie
-- krijgt toegang; browserrollen kunnen de teller niet lezen of wijzigen.
CREATE TABLE IF NOT EXISTS public.flight_lookup_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  lookup_count INTEGER NOT NULL DEFAULT 0 CHECK (lookup_count >= 0),
  PRIMARY KEY (user_id, window_start)
);
ALTER TABLE public.flight_lookup_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.flight_lookup_usage FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.flight_lookup_usage TO service_role;

CREATE OR REPLACE FUNCTION public.consume_flight_lookup_quota(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window TIMESTAMPTZ := date_trunc('hour', now());
  v_count INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RETURN false;
  END IF;

  INSERT INTO public.flight_lookup_usage(user_id, window_start, lookup_count)
  VALUES (p_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start) DO UPDATE
    SET lookup_count = public.flight_lookup_usage.lookup_count + 1
    WHERE public.flight_lookup_usage.lookup_count < p_limit
  RETURNING lookup_count INTO v_count;

  DELETE FROM public.flight_lookup_usage
  WHERE window_start < v_window - interval '7 days';
  RETURN v_count IS NOT NULL AND v_count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_flight_lookup_quota(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_flight_lookup_quota(UUID, INTEGER) TO service_role;

-- Triggerfuncties hoeven nooit rechtstreeks aanroepbaar te zijn.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assign_trip_identifiers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.add_trip_owner_member() FROM PUBLIC, anon, authenticated;

-- Publieke reisfuncties worden door de server met de anon-sleutel gebruikt.
-- Een expliciete authenticated-grant is overbodig en wordt ingetrokken.
REVOKE ALL ON FUNCTION public.list_public_trip_cards() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_trip_cards() TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_trip(TEXT, TEXT, TEXT) TO anon, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
