BEGIN;

-- Several server-side notification producers already supply an internal target.
-- Older databases predate that field, so add it before replacing functions that
-- reference it. Only relative application paths are accepted.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_link_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_link_check
  CHECK (link IS NULL OR (char_length(link) BETWEEN 1 AND 500 AND link ~ '^/[A-Za-z0-9/_?&=.#%:+-]*$'));

-- Older billing code creates a notification for every transaction.* event.
-- Paddle emits transaction.created before the buyer has paid, so suppress any
-- success-looking notification until a terminal event confirms the outcome.
CREATE OR REPLACE FUNCTION private.guard_paddle_transaction_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_type TEXT;
  v_payment_status TEXT;
BEGIN
  IF NEW.kind <> 'account' OR NEW.event_key NOT LIKE 'paddle-transaction:%' THEN
    RETURN NEW;
  END IF;

  SELECT e.event_type, e.payload->'data'->>'status'
  INTO v_event_type, v_payment_status
  FROM public.billing_webhook_events e
  WHERE e.provider = 'paddle'
    AND e.provider_event_id = substring(NEW.event_key FROM char_length('paddle-transaction:') + 1)
  LIMIT 1;

  -- Keep manually created administrative notifications compatible. When the
  -- Paddle event exists, only completion or an actual payment failure is final.
  IF FOUND
    AND v_event_type <> 'transaction.completed'
    AND v_event_type <> 'transaction.payment_failed'
    AND COALESCE(v_payment_status, '') <> 'past_due' THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_paddle_transaction_notification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_paddle_transaction_notification ON public.notifications;
CREATE TRIGGER guard_paddle_transaction_notification
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.guard_paddle_transaction_notification();

-- Keep the generic push private, but send it in exactly one profile language.
CREATE OR REPLACE FUNCTION private.queue_web_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_english BOOLEAN := false;
BEGIN
  IF NEW.dismissed_at IS NOT NULL THEN
    UPDATE public.web_push_outbox SET status = 'cancelled', updated_at = now()
    WHERE notification_id = NEW.id AND status IN ('pending', 'failed');
    RETURN NEW;
  END IF;
  SELECT COALESCE(p.locale = 'en-GB', false) INTO v_english
  FROM public.profiles p WHERE p.id = NEW.user_id;
  v_english := COALESCE(v_english, false);
  INSERT INTO public.web_push_outbox(notification_id, subscription_id, payload)
  SELECT NEW.id, s.id, jsonb_build_object(
    'title', 'GlobeTrotr',
    'body', CASE WHEN v_english THEN 'You have a new notification.' ELSE 'Je hebt een nieuwe melding.' END,
    'url', COALESCE(NEW.link, '/dashboard'),
    'tag', 'notification-' || NEW.id::TEXT
  )
  FROM public.web_push_subscriptions s
  WHERE s.user_id = NEW.user_id AND s.revoked_at IS NULL
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ON CONFLICT(notification_id, subscription_id) DO UPDATE SET
    payload = EXCLUDED.payload,
    status = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN 'pending'
      ELSE web_push_outbox.status END,
    attempts = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN 0
      ELSE web_push_outbox.attempts END,
    available_at = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN now()
      ELSE web_push_outbox.available_at END,
    claimed_at = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN NULL
      ELSE web_push_outbox.claimed_at END,
    sent_at = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN NULL
      ELSE web_push_outbox.sent_at END,
    last_error_code = CASE WHEN web_push_outbox.status IN ('sent', 'cancelled') THEN NULL
      ELSE web_push_outbox.last_error_code END,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.queue_web_push_notification() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS queue_web_push_notification ON public.notifications;
CREATE TRIGGER queue_web_push_notification
AFTER INSERT OR UPDATE OF title, body, created_at, dismissed_at ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.queue_web_push_notification();

-- Queue a harmless end-to-end test from the authenticated portal. The server
-- function calling this RPC supplies the authenticated user id; browsers never
-- receive service-role credentials. The test remains visible in-app, but does
-- not create an unnecessary email.
CREATE OR REPLACE FUNCTION public.queue_web_push_test(p_user UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_notification UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user) THEN
    RAISE EXCEPTION 'PUSH_TEST_USER_NOT_FOUND';
  END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key, link)
  VALUES (
    p_user, 'account', 'Testmelding / Test notification',
    'push-test', 'push-test:' || gen_random_uuid()::TEXT, '/dashboard'
  ) RETURNING id INTO v_notification;
  DELETE FROM public.email_outbox WHERE notification_id = v_notification;
  RETURN v_notification;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_web_push_test(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_web_push_test(UUID) TO service_role;

-- Notify Corporate Admin about a newly submitted privacy request. Responses
-- already notify the requesting user through the application server.
CREATE OR REPLACE FUNCTION private.notify_new_privacy_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, title, body, event_key, link)
  SELECT admin.user_id, 'account',
    'Nieuw privacyverzoek / New privacy request',
    'privacy|' || NEW.request_type || '|' || NEW.requester_email,
    'privacy-request:' || NEW.id::TEXT, '/corporate-admin/governance'
  FROM public.platform_admins admin WHERE admin.active = true
  ON CONFLICT(user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_new_privacy_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_new_privacy_request ON public.privacy_requests;
CREATE TRIGGER notify_new_privacy_request AFTER INSERT ON public.privacy_requests
FOR EACH ROW EXECUTE FUNCTION private.notify_new_privacy_request();

-- A submitted Agency intake form was visible only after manually refreshing
-- its board. Notify the workspace owner and active members who may manage it.
CREATE OR REPLACE FUNCTION private.notify_agency_form_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request public.agency_form_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.agency_form_requests WHERE id = NEW.request_id;
  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key, link)
  SELECT recipients.user_id, 'agency_client',
    'Klantformulier ingevuld / Client form submitted',
    'form|' || left(v_request.title, 140), v_request.trip_uuid,
    'agency-client-form:' || NEW.id::TEXT, '/agency-admin/forms'
  FROM (
    SELECT workspace.user_id FROM public.workspaces workspace
      WHERE workspace.workspace_uuid = NEW.workspace_uuid
    UNION
    SELECT member.user_id FROM public.workspace_members member
      WHERE member.workspace_uuid = NEW.workspace_uuid AND member.status = 'active'
        AND member.user_id IS NOT NULL
        AND private.agency_actor_has_permission(NEW.workspace_uuid, member.user_id, 'members_manage')
  ) recipients
  ON CONFLICT(user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_agency_form_response() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_agency_form_response ON public.agency_form_responses;
CREATE TRIGGER notify_agency_form_response AFTER INSERT ON public.agency_form_responses
FOR EACH ROW EXECUTE FUNCTION private.notify_agency_form_response();

-- Remove premature open notifications and their queued email/push rows. Sent
-- mail cannot be recalled, but a retry of the same non-terminal event remains
-- suppressed by the trigger above.
DELETE FROM public.notifications n
USING public.billing_webhook_events e
WHERE n.event_key = 'paddle-transaction:' || e.provider_event_id
  AND e.provider = 'paddle'
  AND e.event_type <> 'transaction.completed'
  AND e.event_type <> 'transaction.payment_failed'
  AND COALESCE(e.payload->'data'->>'status', '') <> 'past_due';

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES (
  'billing.confirmed-payment-notification', 'Betaling',
  'Controleer dat checkout openen geen betaalbevestiging geeft en transaction.completed precies één melding en mail oplevert',
  'Verify opening checkout sends no payment confirmation and transaction.completed creates exactly one notification and email',
  236
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES (
  'notifications.end-to-end', 'Communicatie',
  'Activeer webpush, verstuur een testmelding en controleer privacyverzoek, bedrijfsmail, boekingsmail en Agency-klantformulier in-app en als push',
  'Enable web push, send a test notification and verify privacy request, company mail, booking mail and Agency client form in-app and as push',
  237
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category, label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en, position = EXCLUDED.position, updated_at = now();

COMMIT;
