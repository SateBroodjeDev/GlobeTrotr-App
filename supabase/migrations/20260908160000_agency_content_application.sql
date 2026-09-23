BEGIN;

CREATE TABLE public.agency_content_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.agency_content_library(id) ON DELETE RESTRICT,
  content_version INTEGER NOT NULL CHECK (content_version > 0),
  target_type TEXT NOT NULL CHECK (target_type IN ('trip','quote')),
  target_id UUID NOT NULL,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_item_id, content_version, target_type, target_id)
);
CREATE INDEX agency_content_applications_workspace_idx
  ON public.agency_content_applications(workspace_uuid, created_at DESC);

ALTER TABLE public.agency_content_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_content_applications FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.agency_content_applications TO service_role;

CREATE OR REPLACE FUNCTION public.apply_agency_content_item(
  p_workspace_uuid UUID,
  p_actor UUID,
  p_content_item_id UUID,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_date DATE DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
  v_item public.agency_content_library%ROWTYPE;
  v_trip public.trips%ROWTYPE;
  v_quote public.agency_quotes%ROWTYPE;
  v_body TEXT;
  v_day DATE;
BEGIN
  IF p_target_type NOT IN ('trip','quote') THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='CONTENT_APPLICATION_TARGET_INVALID';
  END IF;
  SELECT * INTO v_item FROM public.agency_content_library
   WHERE id=p_content_item_id AND workspace_uuid=p_workspace_uuid AND archived_at IS NULL;
  IF NOT FOUND OR (v_item.status<>'published' AND v_item.owner_user_id<>p_actor) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='CONTENT_APPLICATION_ITEM_UNAVAILABLE';
  END IF;
  -- Serialize two simultaneous clicks for the same version and target before
  -- touching the trip or quote. The unique constraint remains the final guard.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    v_item.id::text||':'||v_item.version::text||':'||p_target_type||':'||p_target_id::text,0));
  IF EXISTS(SELECT 1 FROM public.agency_content_applications
    WHERE content_item_id=v_item.id AND content_version=v_item.version
      AND target_type=p_target_type AND target_id=p_target_id) THEN
    RETURN 'duplicate';
  END IF;
  v_body:=concat_ws(E'\n\n',NULLIF(v_item.content->>'summary',''),NULLIF(v_item.content->>'body',''));

  IF p_target_type='quote' THEN
    SELECT * INTO v_quote FROM public.agency_quotes
     WHERE id=p_target_id AND workspace_uuid=p_workspace_uuid AND status IN ('draft','ready') FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='CONTENT_APPLICATION_QUOTE_MISSING';END IF;
    IF char_length(concat_ws(E'\n\n',NULLIF(v_quote.introduction,''),v_body))>3000 THEN
      RAISE EXCEPTION USING ERRCODE='22001',MESSAGE='CONTENT_APPLICATION_QUOTE_TOO_LONG';
    END IF;
    UPDATE public.agency_quotes SET introduction=concat_ws(E'\n\n',NULLIF(introduction,''),v_body),updated_by=p_actor
     WHERE id=v_quote.id;
  ELSE
    SELECT * INTO v_trip FROM public.trips
     WHERE trip_uuid=p_target_id AND workspace_uuid=p_workspace_uuid AND archived=false FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='CONTENT_APPLICATION_TRIP_MISSING';END IF;
    v_day:=COALESCE(p_target_date,v_trip.start_date,current_date);
    IF (v_trip.start_date IS NOT NULL AND v_day<v_trip.start_date)
      OR (v_trip.end_date IS NOT NULL AND v_day>v_trip.end_date) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='CONTENT_APPLICATION_DATE_OUTSIDE_TRIP';
    END IF;
    IF v_item.content_type IN ('accommodation','activity') THEN
      INSERT INTO public.trip_travel_items(workspace_user_id,trip_id,trip_uuid,id,item_type,title,start_date,notes)
      VALUES(v_trip.workspace_user_id,v_trip.id,v_trip.trip_uuid,gen_random_uuid()::text,
        CASE WHEN v_item.content_type='accommodation' THEN 'lodging' ELSE 'activity' END,
        v_item.title,v_day,v_body);
    ELSE
      INSERT INTO public.trip_itinerary_items(workspace_user_id,trip_id,trip_uuid,id,day,title,notes,position)
      VALUES(v_trip.workspace_user_id,v_trip.id,v_trip.trip_uuid,gen_random_uuid()::text,v_day,v_item.title,v_body,
        COALESCE((SELECT max(position)+1 FROM public.trip_itinerary_items
          WHERE workspace_user_id=v_trip.workspace_user_id AND trip_id=v_trip.id AND day=v_day),0));
    END IF;
  END IF;

  INSERT INTO public.agency_content_applications(workspace_uuid,content_item_id,content_version,target_type,target_id,applied_by)
  VALUES(p_workspace_uuid,v_item.id,v_item.version,p_target_type,p_target_id,p_actor);
  RETURN 'applied';
END;
$$;
REVOKE ALL ON FUNCTION public.apply_agency_content_item(UUID,UUID,UUID,TEXT,UUID,DATE) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_agency_content_item(UUID,UUID,UUID,TEXT,UUID,DATE) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('agency.content-application','Agency','Bibliotheekitem vooraf bekijken en precies eenmaal als reisonderdeel, planningitem of offertetekst toepassen','Preview and apply a library item exactly once as a travel item, itinerary item or quote copy',241)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';
COMMIT;
