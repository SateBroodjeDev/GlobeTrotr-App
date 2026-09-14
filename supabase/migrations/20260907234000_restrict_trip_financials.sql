-- Beperk relationele uitgaven tot rollen die financiële gegevens mogen zien.
-- Viewer en client behouden toegang tot de reis, route, planning en documenten.
BEGIN;

CREATE OR REPLACE FUNCTION private.can_view_trip_financials(target_trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.trip_role(target_trip_uuid) IN ('owner', 'traveler', 'advisor', 'finance')
$$;

REVOKE ALL ON FUNCTION private.can_view_trip_financials(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_view_trip_financials(UUID) TO authenticated;

DROP POLICY IF EXISTS "Members read trip expenses" ON public.trip_expenses;
DROP POLICY IF EXISTS "Financial roles read trip expenses" ON public.trip_expenses;
CREATE POLICY "Financial roles read trip expenses" ON public.trip_expenses
  FOR SELECT TO authenticated
  USING ((SELECT private.can_view_trip_financials(trip_uuid)));

NOTIFY pgrst, 'reload schema';
COMMIT;
