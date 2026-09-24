BEGIN;

CREATE OR REPLACE FUNCTION public.get_trip_calendar_feed(p_token TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE t public.trips%ROWTYPE; BEGIN
 SELECT tr.* INTO t FROM public.trip_calendar_feeds f JOIN public.trips tr ON tr.trip_uuid=f.trip_uuid JOIN public.workspaces w ON w.user_id=tr.workspace_user_id
 WHERE f.active AND f.revoked_at IS NULL AND f.token_hash=encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex') AND w.plan IN('pro','agency');
 IF t.trip_uuid IS NULL THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('name',t.name,'start',t.start_date,'end',t.end_date,'updated_at',t.updated_at,
  'itinerary',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'day',i.day,'title',i.title,'notes',i.notes) ORDER BY i.day,i.position) FROM public.trip_itinerary_items i WHERE i.trip_uuid=t.trip_uuid),'[]'::JSONB),
  'bookings',COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.start_date,b.created_at) FROM public.trip_travel_items b WHERE b.trip_uuid=t.trip_uuid),'[]'::JSONB));
END $$;

REVOKE ALL ON FUNCTION public.get_trip_calendar_feed(TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_calendar_feed(TEXT) TO service_role;

UPDATE public.release_checklist_items
SET label_nl='Live agenda abonneren, reis wijzigen en automatische verversing controleren; verblijf en huurauto staan als hele-dagactiviteit',
    label_en='Subscribe to a live calendar, change the trip and verify automatic refresh; lodging and rental cars appear as all-day events',
    updated_at=now()
WHERE item_key='trip.calendar-feed';

COMMIT;
