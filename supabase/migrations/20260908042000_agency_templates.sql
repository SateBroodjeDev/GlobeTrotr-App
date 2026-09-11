-- Herbruikbare Agency-sjablonen voor reisschema's, paklijsten en klantteksten.
-- Uitvoeren na 20260908041000_agency_tasks.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agency_templates(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(char_length(name) BETWEEN 1 AND 80),
 template_type TEXT NOT NULL CHECK(template_type IN('itinerary','packing','message')),
 content JSONB NOT NULL CHECK(jsonb_typeof(content)='array' AND jsonb_array_length(content)<=100),
 archived_at TIMESTAMPTZ,
 created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_templates_workspace_idx ON public.agency_templates(workspace_uuid,template_type,name) WHERE archived_at IS NULL;
CREATE OR REPLACE FUNCTION private.validate_agency_template() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces w WHERE w.workspace_uuid=NEW.workspace_uuid AND w.plan='agency') THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TEMPLATE_WORKSPACE_INVALID'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(NEW.content) item WHERE char_length(item)>1000 OR btrim(item)='') THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='TEMPLATE_CONTENT_INVALID'; END IF;
 NEW.updated_at:=now();RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_agency_template ON public.agency_templates;
CREATE TRIGGER validate_agency_template BEFORE INSERT OR UPDATE ON public.agency_templates FOR EACH ROW EXECUTE FUNCTION private.validate_agency_template();
ALTER TABLE public.agency_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_templates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.agency_templates TO authenticated;
GRANT ALL ON public.agency_templates TO service_role;
CREATE POLICY "Agency members read templates" ON public.agency_templates FOR SELECT TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_view')));
CREATE POLICY "Agency planners create templates" ON public.agency_templates FOR INSERT TO authenticated WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
CREATE POLICY "Agency planners update templates" ON public.agency_templates FOR UPDATE TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan'))) WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
REVOKE ALL ON FUNCTION private.validate_agency_template() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';COMMIT;
