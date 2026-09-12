-- Persistente betaalverzoeken en afgeronde verrekeningsrondes.
-- Uitvoeren na 20260908059000_scheduled_notification_maintenance.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK(kind IN(
 'account','trip_change','invitation','membership','feedback','platform','agency_task',
 'agency_quote','agency_access','trip_document','agency_client','trip_access',
 'trip_booking','trip_expense','trip_settlement'
));

CREATE TABLE IF NOT EXISTS public.trip_settlement_requests(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
 from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 from_name TEXT NOT NULL CHECK(char_length(from_name) BETWEEN 1 AND 120),
 to_name TEXT NOT NULL CHECK(char_length(to_name) BETWEEN 1 AND 120),
 amount NUMERIC(14,2) NOT NULL CHECK(amount>0),
 currency TEXT NOT NULL CHECK(currency~'^[A-Z]{3}$'),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','completed','cancelled')),
 created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),completed_at TIMESTAMPTZ,
 CHECK(from_user_id<>to_user_id)
);
CREATE INDEX IF NOT EXISTS trip_settlement_requests_trip_status_idx ON public.trip_settlement_requests(trip_uuid,status,created_at DESC);
ALTER TABLE public.trip_settlement_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_settlement_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_settlement_requests TO service_role;

CREATE OR REPLACE FUNCTION private.settlement_participant_user(p_trip UUID,p_key TEXT)
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user UUID;
BEGIN
 IF p_key LIKE 'owner:%' THEN
  BEGIN v_user:=substring(p_key FROM 7)::UUID;EXCEPTION WHEN invalid_text_representation THEN RETURN NULL;END;
  IF EXISTS(SELECT 1 FROM public.trips trip WHERE trip.trip_uuid=p_trip AND trip.workspace_user_id=v_user) THEN RETURN v_user;END IF;
 ELSIF p_key LIKE 'member:%' THEN
  SELECT member.user_id INTO v_user FROM public.trip_members member
  WHERE member.trip_uuid=p_trip AND member.id=substring(p_key FROM 8) AND member.status='active';
  RETURN v_user;
 END IF;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.publish_trip_settlement(
 p_actor UUID,p_trip UUID,p_action TEXT,p_currency TEXT,p_transfers JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip public.trips%ROWTYPE;v_item JSONB;v_from UUID;v_to UUID;v_request UUID;v_count INTEGER:=0;v_user UUID;
BEGIN
 SELECT * INTO v_trip FROM public.trips trip WHERE trip.trip_uuid=p_trip FOR UPDATE;
 IF NOT FOUND OR p_actor IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='SETTLEMENT_ACCESS_REQUIRED';END IF;
 IF NOT (p_actor=v_trip.workspace_user_id
   OR EXISTS(SELECT 1 FROM public.trip_members member WHERE member.trip_uuid=p_trip AND member.user_id=p_actor AND member.status='active' AND member.role IN('traveler','advisor','finance'))
   OR (v_trip.workspace_uuid IS NOT NULL AND private.agency_actor_has_permission(v_trip.workspace_uuid,p_actor,'expenses_manage'))
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='SETTLEMENT_ACCESS_REQUIRED';END IF;
 IF p_action NOT IN('request','complete') OR p_currency!~'^[A-Z]{3}$' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_SETTLEMENT';END IF;

 IF p_action='complete' THEN
  UPDATE public.trip_settlement_requests SET status='completed',completed_at=now()
  WHERE trip_uuid=p_trip AND status='pending';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  UPDATE public.notifications SET dismissed_at=COALESCE(dismissed_at,now())
  WHERE trip_uuid=p_trip AND kind='trip_settlement' AND event_key LIKE 'settlement-request:%';
  FOR v_user IN SELECT v_trip.workspace_user_id UNION SELECT member.user_id FROM public.trip_members member WHERE member.trip_uuid=p_trip AND member.status='active' AND member.user_id IS NOT NULL LOOP
   IF v_user IS DISTINCT FROM p_actor THEN
    INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
    VALUES(v_user,'trip_settlement','Verrekening afgerond / Settlement completed','completed|'||left(replace(v_trip.name,'|',''),30),p_trip,'trip-settlement:'||p_trip::TEXT)
    ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
   END IF;
  END LOOP;
  RETURN jsonb_build_object('status','completed','count',v_count);
 END IF;

 IF jsonb_typeof(p_transfers)<>'array' OR jsonb_array_length(p_transfers)>50 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_TRANSFERS';END IF;
 UPDATE public.trip_settlement_requests SET status='cancelled' WHERE trip_uuid=p_trip AND status='pending';
 UPDATE public.notifications SET dismissed_at=COALESCE(dismissed_at,now()) WHERE trip_uuid=p_trip AND kind='trip_settlement' AND event_key LIKE 'settlement-request:%';
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_transfers) LOOP
  v_from:=private.settlement_participant_user(p_trip,v_item->>'fromId');v_to:=private.settlement_participant_user(p_trip,v_item->>'toId');
  IF v_from IS NULL OR v_to IS NULL THEN CONTINUE;END IF;
  IF COALESCE((v_item->>'amount')::NUMERIC,0)<=0 OR COALESCE((v_item->>'amount')::NUMERIC,0)>100000000 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_TRANSFER_AMOUNT';END IF;
  INSERT INTO public.trip_settlement_requests(trip_uuid,from_user_id,to_user_id,from_name,to_name,amount,currency,created_by)
  VALUES(p_trip,v_from,v_to,left(COALESCE(NULLIF(v_item->>'from',''),'Reiziger'),120),left(COALESCE(NULLIF(v_item->>'to',''),'Reiziger'),120),round((v_item->>'amount')::NUMERIC,2),p_currency,p_actor) RETURNING id INTO v_request;
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  VALUES(v_from,'trip_settlement','Betaalverzoek / Payment request','request|'||left(replace(v_trip.name,'|',''),30)||'|'||left(replace(v_item->>'to','|',''),120)||'|'||round((v_item->>'amount')::NUMERIC,2)::TEXT||'|'||p_currency,p_trip,'settlement-request:'||v_request::TEXT);
  v_count:=v_count+1;
 END LOOP;
 RETURN jsonb_build_object('status','published','count',v_count);
END $$;

REVOKE ALL ON FUNCTION private.settlement_participant_user(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.publish_trip_settlement(UUID,UUID,TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_trip_settlement(UUID,UUID,TEXT,TEXT,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
