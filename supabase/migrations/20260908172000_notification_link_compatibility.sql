BEGIN;

-- Repair databases where migration 1700 was applied before notification links
-- were added to its definition. This migration is intentionally idempotent.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_link_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_link_check
  CHECK (
    link IS NULL OR (
      char_length(link) BETWEEN 1 AND 500
      AND link ~ '^/[A-Za-z0-9/_?&=.#%:+-]*$'
    )
  );

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
AFTER INSERT OR UPDATE OF title, body, created_at, dismissed_at, link ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.queue_web_push_notification();

NOTIFY pgrst, 'reload schema';
COMMIT;
