-- Rond de actuele reisnotificaties af voor boekingen en uitgaven.
-- Snapshotopslag wordt als één wijziging behandeld; interne delete/insert-stappen
-- leveren geen dubbele of misleidende meldingen op.
-- Uitvoeren na 20260908057000_important_trip_notifications.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK(kind IN(
 'account','trip_change','invitation','membership','feedback','platform','agency_task',
 'agency_quote','agency_access','trip_document','agency_client','trip_access',
 'trip_booking','trip_expense'
));

-- Maak profiel- en abonnementsmeldingen vertaalbaar en bundel opvolgende
-- wijzigingen in plaats van per transactie een nieuwe regel te bewaren.
CREATE OR REPLACE FUNCTION private.notify_account_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF ROW(NEW.display_name,NEW.phone,NEW.avatar_path,NEW.email)
  IS DISTINCT FROM ROW(OLD.display_name,OLD.phone,OLD.avatar_path,OLD.email) THEN
  INSERT INTO public.notifications(user_id,kind,title,body,event_key)
  VALUES(NEW.id,'account','Account bijgewerkt / Account updated','profile|updated','account-profile')
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.notify_plan_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.plan IS DISTINCT FROM OLD.plan THEN
  INSERT INTO public.notifications(user_id,kind,title,body,event_key)
  VALUES(NEW.user_id,'account','Abonnement gewijzigd / Subscription changed','plan|'||NEW.plan,'account-plan')
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.notify_trip_invitation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 SELECT auth_user.id,'invitation','Reisuitnodiging / Trip invitation','trip|'||left(replace(trip.name,'|',''),30),
  NEW.trip_uuid,'invitation:'||NEW.id::TEXT
 FROM auth.users auth_user JOIN public.trips trip ON trip.trip_uuid=NEW.trip_uuid
 WHERE lower(auth_user.email)=lower(NEW.email) AND auth_user.email_confirmed_at IS NOT NULL
  AND NEW.accepted_at IS NULL AND NEW.declined_at IS NULL AND NEW.revoked_at IS NULL AND NEW.expires_at>now()
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
  trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.notify_pending_invitations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.email_confirmed_at IS NOT NULL THEN
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  SELECT NEW.id,'invitation','Reisuitnodiging / Trip invitation','trip|'||left(replace(trip.name,'|',''),30),
   invitation.trip_uuid,'invitation:'||invitation.id::TEXT
  FROM public.trip_invitations invitation JOIN public.trips trip ON trip.trip_uuid=invitation.trip_uuid
  WHERE lower(invitation.email)=lower(NEW.email) AND invitation.accepted_at IS NULL
   AND invitation.declined_at IS NULL AND invitation.revoked_at IS NULL AND invitation.expires_at>now()
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
   trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.notify_workspace_invitation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_name TEXT;
BEGIN
 SELECT COALESCE(NULLIF(settings.system_name,''),NULLIF(workspace.data->'branding'->>'brandName',''),'GlobeTrotr Agency')
 INTO v_name FROM public.workspaces workspace
 LEFT JOIN public.agency_settings settings ON settings.workspace_uuid=workspace.workspace_uuid
 WHERE workspace.workspace_uuid=NEW.workspace_uuid;
 INSERT INTO public.notifications(user_id,kind,title,body,event_key)
 SELECT auth_user.id,'invitation','Agency-uitnodiging / Agency invitation',
  'agency|'||left(replace(v_name,'|',''),80),'workspace-invitation:'||NEW.id::TEXT
 FROM auth.users auth_user WHERE lower(auth_user.email)=lower(NEW.email) AND auth_user.email_confirmed_at IS NOT NULL
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.upsert_trip_content_notification(
 p_trip UUID,p_kind TEXT,p_action TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_owner UUID;v_workspace UUID;v_actor UUID;v_name TEXT;v_user UUID;
BEGIN
 IF p_kind NOT IN('trip_booking','trip_expense') OR p_action NOT IN('added','updated','removed','multiple') THEN RETURN;END IF;
 SELECT trip.workspace_user_id,trip.workspace_uuid,trip.name INTO v_owner,v_workspace,v_name
 FROM public.trips trip WHERE trip.trip_uuid=p_trip;
 IF NOT FOUND THEN RETURN;END IF;
 v_actor:=private.current_trip_actor(v_owner);
 FOR v_user IN
  SELECT v_owner
  UNION SELECT member.user_id FROM public.trip_members member
   WHERE member.trip_uuid=p_trip AND member.status='active' AND member.user_id IS NOT NULL
    AND (p_kind='trip_booking' OR member.role IN('traveler','advisor','finance'))
  UNION SELECT member.user_id FROM public.workspace_members member
   WHERE member.workspace_uuid=v_workspace AND member.status='active' AND member.user_id IS NOT NULL
    AND private.agency_actor_has_permission(v_workspace,member.user_id,
      CASE WHEN p_kind='trip_expense' THEN 'expenses_manage' ELSE 'trips_view' END)
 LOOP
  IF v_user IS DISTINCT FROM v_actor AND NOT EXISTS(
   SELECT 1 FROM public.agency_notification_preferences preference
   WHERE preference.workspace_uuid=v_workspace AND preference.user_id=v_user AND preference.trip_changes=false
  ) THEN
   INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
   VALUES(v_user,p_kind,
    CASE WHEN p_kind='trip_expense' THEN 'Reisuitgaven gewijzigd / Trip expenses changed' ELSE 'Boekingen gewijzigd / Bookings changed' END,
    p_action||'|'||left(replace(v_name,'|',''),30),p_trip,
    CASE WHEN p_kind='trip_expense' THEN 'trip-expenses:' ELSE 'trip-bookings:' END||p_trip::TEXT)
   ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
  END IF;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.notify_trip_content_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip UUID;v_kind TEXT;v_action TEXT;
BEGIN
 IF current_setting('app.trip_snapshot_write',true)='true' THEN
  IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
 END IF;
 IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN RETURN NEW;END IF;
 v_trip:=CASE WHEN TG_OP='DELETE' THEN OLD.trip_uuid ELSE NEW.trip_uuid END;
 v_kind:=CASE WHEN TG_TABLE_NAME='trip_expenses' THEN 'trip_expense' ELSE 'trip_booking' END;
 v_action:=CASE TG_OP WHEN 'INSERT' THEN 'added' WHEN 'DELETE' THEN 'removed' ELSE 'updated' END;
 PERFORM private.upsert_trip_content_notification(v_trip,v_kind,v_action);
 IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END $$;

CREATE OR REPLACE FUNCTION private.notify_trip_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip UUID;v_owner UUID;v_actor UUID;v_name TEXT;v_actor_name TEXT;
BEGIN
 IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN RETURN NULL;END IF;
 IF TG_TABLE_NAME IN('trip_stops','trip_travel_items','trip_expenses','trip_documents') THEN RETURN NULL;END IF;
 IF TG_TABLE_NAME='trips' AND ROW(NEW.start_date,NEW.end_date,NEW.is_public,NEW.share_pin_hash,NEW.share_financials)
  IS DISTINCT FROM ROW(OLD.start_date,OLD.end_date,OLD.is_public,OLD.share_pin_hash,OLD.share_financials) THEN RETURN NULL;END IF;
 IF TG_OP='DELETE' THEN v_trip:=OLD.trip_uuid;ELSE v_trip:=NEW.trip_uuid;END IF;
 SELECT workspace_user_id,name INTO v_owner,v_name FROM public.trips WHERE trip_uuid=v_trip;
 IF NOT FOUND THEN RETURN NULL;END IF;
 v_actor:=private.current_trip_actor(v_owner);
 SELECT COALESCE(NULLIF(display_name,''),'Een reisgenoot') INTO v_actor_name FROM public.profiles WHERE id=v_actor;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 SELECT DISTINCT member.user_id,'trip_change','Reis bijgewerkt',COALESCE(v_actor_name,'Een reisgenoot')||' heeft '||v_name||' gewijzigd.',v_trip,'trip:'||v_trip::TEXT
 FROM public.trip_members member WHERE member.trip_uuid=v_trip AND member.status='active' AND member.user_id IS NOT NULL AND member.user_id<>v_actor
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=now(),dismissed_at=NULL;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.save_trip_snapshot_versioned_as(
 p_workspace_user_id UUID,p_actor_user_id UUID,p_trip JSONB
) RETURNS TABLE(trip_uuid UUID,revision TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_trip UUID;v_workspace UUID;v_before_stops JSONB;v_after_stops JSONB;
 v_before_bookings JSONB;v_after_bookings JSONB;v_before_expenses JSONB;v_after_expenses JSONB;
 v_booking_action TEXT;v_expense_action TEXT;
BEGIN
 BEGIN v_trip:=(p_trip->>'id')::UUID;
 EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='INVALID_TRIP';END;
 SELECT trip.workspace_uuid INTO v_workspace FROM public.trips trip
 WHERE trip.trip_uuid=v_trip AND trip.workspace_user_id=p_workspace_user_id;
 IF NOT FOUND OR p_actor_user_id IS NULL OR NOT(
  p_actor_user_id=p_workspace_user_id
  OR EXISTS(SELECT 1 FROM public.trip_members member WHERE member.trip_uuid=v_trip AND member.user_id=p_actor_user_id AND member.status='active')
  OR EXISTS(SELECT 1 FROM public.workspace_members member WHERE member.workspace_uuid=v_workspace AND member.user_id=p_actor_user_id AND member.status='active')
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='TRIP_ACCESS_REQUIRED';END IF;

 SELECT COALESCE(jsonb_agg(to_jsonb(stop)-'created_at'-'updated_at' ORDER BY stop.position,stop.id),'[]'::JSONB)
 INTO v_before_stops FROM public.trip_stops stop WHERE stop.trip_uuid=v_trip;
 SELECT COALESCE(jsonb_agg(to_jsonb(item)-'created_at'-'updated_at' ORDER BY item.start_date,item.id),'[]'::JSONB)
 INTO v_before_bookings FROM public.trip_travel_items item WHERE item.trip_uuid=v_trip;
 SELECT COALESCE(jsonb_agg(to_jsonb(expense)-'created_at'-'updated_at' ORDER BY expense.expense_date,expense.id),'[]'::JSONB)
 INTO v_before_expenses FROM public.trip_expenses expense WHERE expense.trip_uuid=v_trip;
 PERFORM set_config('app.trip_actor_id',p_actor_user_id::TEXT,true);
 PERFORM set_config('app.trip_snapshot_write','true',true);
 RETURN QUERY SELECT saved.trip_uuid,saved.revision FROM public.save_trip_snapshot_versioned(p_workspace_user_id,p_trip) saved;
 PERFORM set_config('app.trip_snapshot_write','false',true);
 SELECT COALESCE(jsonb_agg(to_jsonb(stop)-'created_at'-'updated_at' ORDER BY stop.position,stop.id),'[]'::JSONB)
 INTO v_after_stops FROM public.trip_stops stop WHERE stop.trip_uuid=v_trip;
 SELECT COALESCE(jsonb_agg(to_jsonb(item)-'created_at'-'updated_at' ORDER BY item.start_date,item.id),'[]'::JSONB)
 INTO v_after_bookings FROM public.trip_travel_items item WHERE item.trip_uuid=v_trip;
 SELECT COALESCE(jsonb_agg(to_jsonb(expense)-'created_at'-'updated_at' ORDER BY expense.expense_date,expense.id),'[]'::JSONB)
 INTO v_after_expenses FROM public.trip_expenses expense WHERE expense.trip_uuid=v_trip;

 IF v_before_stops IS DISTINCT FROM v_after_stops THEN PERFORM private.upsert_important_trip_notification(v_trip,'destinations','');END IF;
 IF v_before_bookings IS DISTINCT FROM v_after_bookings THEN
  v_booking_action:=CASE WHEN jsonb_array_length(v_before_bookings)=0 THEN 'added' WHEN jsonb_array_length(v_after_bookings)=0 THEN 'removed' WHEN jsonb_array_length(v_before_bookings)=jsonb_array_length(v_after_bookings) THEN 'updated' ELSE 'multiple' END;
  PERFORM private.upsert_trip_content_notification(v_trip,'trip_booking',v_booking_action);
 END IF;
 IF v_before_expenses IS DISTINCT FROM v_after_expenses THEN
  v_expense_action:=CASE WHEN jsonb_array_length(v_before_expenses)=0 THEN 'added' WHEN jsonb_array_length(v_after_expenses)=0 THEN 'removed' WHEN jsonb_array_length(v_before_expenses)=jsonb_array_length(v_after_expenses) THEN 'updated' ELSE 'multiple' END;
  PERFORM private.upsert_trip_content_notification(v_trip,'trip_expense',v_expense_action);
 END IF;
END $$;

DROP TRIGGER IF EXISTS notify_trip_booking_change ON public.trip_travel_items;
CREATE TRIGGER notify_trip_booking_change AFTER INSERT OR UPDATE OR DELETE ON public.trip_travel_items
 FOR EACH ROW EXECUTE FUNCTION private.notify_trip_content_change();
DROP TRIGGER IF EXISTS notify_trip_expense_change ON public.trip_expenses;
CREATE TRIGGER notify_trip_expense_change AFTER INSERT OR UPDATE OR DELETE ON public.trip_expenses
 FOR EACH ROW EXECUTE FUNCTION private.notify_trip_content_change();

REVOKE ALL ON FUNCTION private.upsert_trip_content_notification(UUID,TEXT,TEXT),private.notify_trip_content_change() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.notify_account_change(),private.notify_plan_change(),private.notify_trip_invitation(),private.notify_pending_invitations() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.notify_workspace_invitation() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_trip_snapshot_versioned_as(UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_trip_snapshot_versioned_as(UUID,UUID,JSONB) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
