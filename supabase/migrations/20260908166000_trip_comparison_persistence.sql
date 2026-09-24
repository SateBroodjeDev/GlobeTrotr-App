BEGIN;

-- Keep comparison candidates in the relational table in the same transaction
-- as the versioned trip snapshot. Comments and polls reference these rows.
CREATE OR REPLACE FUNCTION public.save_trip_snapshot_with_options_as(
  p_workspace_user_id UUID, p_actor_user_id UUID, p_trip JSONB
) RETURNS TABLE(trip_uuid UUID, revision TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_trip UUID;
  v_trip_id TEXT;
  v_option JSONB;
BEGIN
  BEGIN v_trip := (p_trip->>'id')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='INVALID_TRIP';
  END;

  SELECT trip.id INTO v_trip_id
  FROM public.trips trip
  WHERE trip.trip_uuid=v_trip AND trip.workspace_user_id=p_workspace_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='TRIP_ACCESS_REQUIRED'; END IF;

  RETURN QUERY SELECT saved.trip_uuid, saved.revision
  FROM public.save_trip_snapshot_versioned_as(p_workspace_user_id,p_actor_user_id,p_trip) saved;

  FOR v_option IN SELECT value FROM jsonb_array_elements(COALESCE(p_trip->'travelOptions','[]'::JSONB)) LOOP
    INSERT INTO public.trip_travel_options(
      workspace_user_id,trip_id,trip_uuid,id,option_type,title,start_date,end_date,
      provider,amount,currency,charges_included,cancellation,duration_minutes,
      distance_km,source_url,notes,details,status,checked_at,converted_travel_item_id,created_at,updated_at
    ) VALUES (
      p_workspace_user_id,v_trip_id,v_trip,v_option->>'id',v_option->>'type',v_option->>'title',
      (v_option->>'startDate')::DATE,NULLIF(v_option->>'endDate','')::DATE,
      NULLIF(v_option->>'provider',''),NULLIF(v_option->>'amount','')::NUMERIC,NULLIF(v_option->>'currency',''),
      COALESCE((v_option->>'chargesIncluded')::BOOLEAN,false),NULLIF(v_option->>'cancellation',''),
      NULLIF(v_option->>'durationMinutes','')::INTEGER,NULLIF(v_option->>'distanceKm','')::NUMERIC,
      NULLIF(v_option->>'sourceUrl',''),NULLIF(v_option->>'notes',''),COALESCE(v_option->'details','{}'::JSONB),
      v_option->>'status',NULLIF(v_option->>'checkedAt','')::TIMESTAMPTZ,
      NULLIF(v_option->>'convertedTravelItemId',''),COALESCE(NULLIF(v_option->>'createdAt','')::TIMESTAMPTZ,now()),now()
    )
    ON CONFLICT(workspace_user_id,trip_id,id) DO UPDATE SET
      option_type=EXCLUDED.option_type,title=EXCLUDED.title,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,
      provider=EXCLUDED.provider,amount=EXCLUDED.amount,currency=EXCLUDED.currency,charges_included=EXCLUDED.charges_included,
      cancellation=EXCLUDED.cancellation,duration_minutes=EXCLUDED.duration_minutes,distance_km=EXCLUDED.distance_km,
      source_url=EXCLUDED.source_url,notes=EXCLUDED.notes,details=EXCLUDED.details,status=EXCLUDED.status,
      checked_at=EXCLUDED.checked_at,converted_travel_item_id=EXCLUDED.converted_travel_item_id,updated_at=now();
  END LOOP;

  DELETE FROM public.trip_travel_options option
  WHERE option.trip_uuid=v_trip
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(p_trip->'travelOptions','[]'::JSONB)) entry
      WHERE entry->>'id'=option.id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_trip_snapshot_with_options_as(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot_with_options_as(UUID,UUID,JSONB) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('trip.comparison-persistence','Reizen','Kandidaat opslaan, reactie plaatsen en peiling starten zonder verdwijnen controleren','Verify saving a candidate, posting a comment and starting a poll without candidates disappearing',166)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst,'reload schema';
COMMIT;
