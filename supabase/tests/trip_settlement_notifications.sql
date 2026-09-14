-- Uitvoeren na 20260908060000_trip_settlement_notifications.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE tsn AS SELECT gen_random_uuid() owner_id,gen_random_uuid() member_id,gen_random_uuid() trip_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'settlement-owner@example.invalid',now() FROM tsn
 UNION ALL SELECT member_id,'settlement-member@example.invalid',now() FROM tsn;
INSERT INTO public.workspaces(user_id,data) SELECT owner_id,'{}'::JSONB FROM tsn;
INSERT INTO public.trips(workspace_user_id,id,trip_uuid,name) SELECT owner_id,trip_id::TEXT,trip_id,'Verrekenreis' FROM tsn;
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,accepted_at)
 SELECT owner_id,trip_id::TEXT,trip_id,'settle-member',member_id,'Reisgenoot','settlement-member@example.invalid','traveler','active',now() FROM tsn;
DO $$DECLARE v_owner UUID;v_member UUID;v_trip UUID;v_result JSONB;BEGIN
 SELECT owner_id,member_id,trip_id INTO v_owner,v_member,v_trip FROM tsn;
 SELECT public.publish_trip_settlement(v_owner,v_trip,'request','EUR',jsonb_build_array(jsonb_build_object(
  'from','Reisgenoot','fromId','member:settle-member','to','Eigenaar','toId','owner:'||v_owner::TEXT,'amount',25.50))) INTO v_result;
 IF v_result->>'status'<>'published' OR v_result->>'count'<>'1' THEN RAISE EXCEPTION 'Betaalverzoek werd niet gepubliceerd';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND kind='trip_settlement' AND body='request|Verrekenreis|Eigenaar|25.50|EUR' AND dismissed_at IS NULL) THEN RAISE EXCEPTION 'Betaalverzoekmelding ontbreekt';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id NOT IN(v_owner,v_member) AND kind='trip_settlement') THEN RAISE EXCEPTION 'Verrekening lekt naar een buitenstaander';END IF;
 SELECT public.publish_trip_settlement(v_owner,v_trip,'complete','EUR','[]'::JSONB) INTO v_result;
 IF v_result->>'status'<>'completed' OR EXISTS(SELECT 1 FROM public.trip_settlement_requests WHERE trip_uuid=v_trip AND status='pending') THEN RAISE EXCEPTION 'Verrekening werd niet afgerond';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications WHERE kind='trip_settlement' AND event_key LIKE 'settlement-request:%' AND dismissed_at IS NULL) THEN RAISE EXCEPTION 'Afgerond betaalverzoek bleef open';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_member AND event_key='trip-settlement:'||v_trip::TEXT AND body='completed|Verrekenreis') THEN RAISE EXCEPTION 'Afrondingsmelding ontbreekt';END IF;
END $$;
ROLLBACK;
