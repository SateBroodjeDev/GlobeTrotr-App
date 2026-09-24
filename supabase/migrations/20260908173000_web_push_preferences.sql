BEGIN;

CREATE OR REPLACE FUNCTION private.web_push_preference_key(p_kind TEXT, p_event_key TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_kind IN ('invitation','membership','agency_access','trip_access')
      THEN 'pushInvitations'
    WHEN p_kind = 'flight_alert'
      THEN 'pushFlightAlerts'
    WHEN p_kind = 'trip_settlement'
      OR COALESCE(p_event_key, '') LIKE 'paddle-%'
      OR COALESCE(p_event_key, '') LIKE 'billing-%'
      OR COALESCE(p_event_key, '') LIKE 'payment-%'
      THEN 'pushPayments'
    WHEN p_kind IN ('trip_change','trip_booking','trip_document','trip_expense',
      'agency_task','agency_quote','agency_client')
      THEN 'pushTripUpdates'
    ELSE 'pushAccountService'
  END
$$;

CREATE OR REPLACE FUNCTION private.web_push_allowed(p_user UUID, p_kind TEXT, p_event_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    profile.notification_preferences ->> private.web_push_preference_key(p_kind, p_event_key) <> 'false',
    true
  )
  FROM public.profiles profile
  WHERE profile.id = p_user
$$;

REVOKE ALL ON FUNCTION private.web_push_preference_key(TEXT,TEXT),
  private.web_push_allowed(UUID,TEXT,TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.queue_web_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_english BOOLEAN := false;
BEGIN
  IF NEW.dismissed_at IS NOT NULL THEN
    UPDATE public.web_push_outbox SET status='cancelled',updated_at=now()
    WHERE notification_id=NEW.id AND status IN('pending','failed');
    RETURN NEW;
  END IF;
  IF NOT COALESCE(private.web_push_allowed(NEW.user_id,NEW.kind,NEW.event_key),true) THEN
    UPDATE public.web_push_outbox SET status='cancelled',updated_at=now()
    WHERE notification_id=NEW.id AND status IN('pending','failed');
    RETURN NEW;
  END IF;
  SELECT COALESCE(profile.locale='en-GB',false) INTO v_english
  FROM public.profiles profile WHERE profile.id=NEW.user_id;
  v_english:=COALESCE(v_english,false);
  INSERT INTO public.web_push_outbox(notification_id,subscription_id,payload)
  SELECT NEW.id,subscription.id,jsonb_build_object(
    'title','GlobeTrotr',
    'body',CASE WHEN v_english THEN 'You have a new notification.' ELSE 'Je hebt een nieuwe melding.' END,
    'url',COALESCE(NEW.link,'/dashboard'),
    'tag','notification-'||NEW.id::TEXT)
  FROM public.web_push_subscriptions subscription
  WHERE subscription.user_id=NEW.user_id AND subscription.revoked_at IS NULL
    AND (subscription.expires_at IS NULL OR subscription.expires_at>now())
  ON CONFLICT(notification_id,subscription_id) DO UPDATE SET
    payload=EXCLUDED.payload,
    status=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN 'pending' ELSE web_push_outbox.status END,
    attempts=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN 0 ELSE web_push_outbox.attempts END,
    available_at=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN now() ELSE web_push_outbox.available_at END,
    claimed_at=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN NULL ELSE web_push_outbox.claimed_at END,
    sent_at=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN NULL ELSE web_push_outbox.sent_at END,
    last_error_code=CASE WHEN web_push_outbox.status IN('sent','cancelled') THEN NULL ELSE web_push_outbox.last_error_code END,
    updated_at=now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.queue_web_push_notification() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS queue_web_push_notification ON public.notifications;
CREATE TRIGGER queue_web_push_notification
AFTER INSERT OR UPDATE OF title,body,created_at,dismissed_at ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.queue_web_push_notification();

CREATE OR REPLACE FUNCTION private.cancel_disabled_web_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.notification_preferences IS NOT DISTINCT FROM OLD.notification_preferences THEN RETURN NEW; END IF;
  UPDATE public.web_push_outbox outbox SET status='cancelled',updated_at=now()
  FROM public.notifications notification
  WHERE outbox.notification_id=notification.id AND notification.user_id=NEW.id
    AND outbox.status IN('pending','failed')
    AND NOT COALESCE(private.web_push_allowed(notification.user_id,notification.kind,notification.event_key),true);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.cancel_disabled_web_push() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS cancel_disabled_web_push ON public.profiles;
CREATE TRIGGER cancel_disabled_web_push
AFTER UPDATE OF notification_preferences ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.cancel_disabled_web_push();

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('notifications.push-preferences','Communicatie',
  'Push per apparaat activeren en categorieën voor uitnodigingen, reizen, betalingen, vluchten en account/service afzonderlijk controleren',
  'Enable push per device and separately verify categories for invitations, trips, payments, flights and account/service notices',238)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
