-- Relationele Agency-offertes met meerdere prijsvarianten.
-- Uitvoeren na 20260908042000_agency_templates.sql.
BEGIN;
CREATE TABLE public.agency_quotes(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE RESTRICT,trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE SET NULL,
 title TEXT NOT NULL CHECK(char_length(title) BETWEEN 1 AND 120),introduction TEXT CHECK(introduction IS NULL OR char_length(introduction)<=3000),
 currency TEXT NOT NULL DEFAULT 'EUR' CHECK(currency~'^[A-Z]{3}$'),status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','ready','accepted','rejected','expired','cancelled')),
 valid_until DATE,accepted_variant_id UUID,created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.agency_quote_variants(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),quote_id UUID NOT NULL REFERENCES public.agency_quotes(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(char_length(name) BETWEEN 1 AND 80),description TEXT CHECK(description IS NULL OR char_length(description)<=2000),
 amount NUMERIC(14,2) NOT NULL CHECK(amount>=0),position INTEGER NOT NULL CHECK(position>=0),UNIQUE(quote_id,position)
);
ALTER TABLE public.agency_quotes ADD CONSTRAINT agency_quotes_accepted_variant_fk FOREIGN KEY(accepted_variant_id) REFERENCES public.agency_quote_variants(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX agency_quotes_workspace_status_idx ON public.agency_quotes(workspace_uuid,status,valid_until);
CREATE OR REPLACE FUNCTION private.validate_agency_quote_scope() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.agency_clients c WHERE c.id=NEW.client_id AND c.workspace_uuid=NEW.workspace_uuid) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='QUOTE_CLIENT_WORKSPACE_MISMATCH';END IF;
 IF NEW.trip_uuid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.trips t WHERE t.trip_uuid=NEW.trip_uuid AND t.workspace_uuid=NEW.workspace_uuid) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='QUOTE_TRIP_WORKSPACE_MISMATCH';END IF;
 IF NEW.accepted_variant_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.agency_quote_variants v WHERE v.id=NEW.accepted_variant_id AND v.quote_id=NEW.id) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='QUOTE_VARIANT_MISMATCH';END IF;
 NEW.updated_at=now();RETURN NEW;END $$;
CREATE TRIGGER validate_agency_quote_scope BEFORE INSERT OR UPDATE ON public.agency_quotes FOR EACH ROW EXECUTE FUNCTION private.validate_agency_quote_scope();
ALTER TABLE public.agency_quotes ENABLE ROW LEVEL SECURITY;ALTER TABLE public.agency_quote_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_quotes,public.agency_quote_variants FROM PUBLIC,anon,authenticated;GRANT SELECT,INSERT,UPDATE ON public.agency_quotes,public.agency_quote_variants TO authenticated;GRANT ALL ON public.agency_quotes,public.agency_quote_variants TO service_role;
CREATE POLICY "Agency members read quotes" ON public.agency_quotes FOR SELECT TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_view')));
CREATE POLICY "Agency planners manage quotes" ON public.agency_quotes FOR ALL TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan'))) WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
CREATE POLICY "Agency members read quote variants" ON public.agency_quote_variants FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.agency_quotes q WHERE q.id=quote_id));
CREATE POLICY "Agency planners manage quote variants" ON public.agency_quote_variants FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.agency_quotes q WHERE q.id=quote_id AND private.workspace_has_permission(q.workspace_uuid,'trips_plan'))) WITH CHECK(EXISTS(SELECT 1 FROM public.agency_quotes q WHERE q.id=quote_id AND private.workspace_has_permission(q.workspace_uuid,'trips_plan')));
REVOKE ALL ON FUNCTION private.validate_agency_quote_scope() FROM PUBLIC,anon,authenticated;NOTIFY pgrst,'reload schema';COMMIT;
