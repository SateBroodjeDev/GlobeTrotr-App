-- Sluit cross-workspace inzage in prijsvarianten van Agency-offertes.
BEGIN;
DROP POLICY IF EXISTS "Agency members read quote variants" ON public.agency_quote_variants;
CREATE POLICY "Agency members read quote variants" ON public.agency_quote_variants
FOR SELECT TO authenticated
USING(EXISTS(
  SELECT 1 FROM public.agency_quotes quote
  WHERE quote.id=agency_quote_variants.quote_id
    AND private.workspace_has_permission(quote.workspace_uuid,'trips_view')
));
COMMENT ON POLICY "Agency members read quote variants" ON public.agency_quote_variants IS
'Alleen actieve leden van de bijbehorende Agency-workspace met trips_view mogen prijsvarianten lezen.';
NOTIFY pgrst,'reload schema';
COMMIT;
