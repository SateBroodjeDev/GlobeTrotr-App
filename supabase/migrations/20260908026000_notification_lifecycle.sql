-- Voeg volledige, samengevoegde productmeldingen toe.
-- Uitvoeren na 20260908025000_notify_invitation_responses.sql.
BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('account', 'trip_change', 'invitation', 'membership', 'feedback', 'platform'));

-- Bewaar van bestaande reiswijzigingen alleen de nieuwste melding per
-- ontvanger en reis en geef die direct de nieuwe stabiele sleutel.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, trip_uuid ORDER BY created_at DESC, id DESC
  ) AS position
  FROM public.notifications WHERE kind = 'trip_change' AND trip_uuid IS NOT NULL
)
DELETE FROM public.notifications AS notification
USING ranked WHERE notification.id = ranked.id AND ranked.position > 1;
UPDATE public.notifications
SET event_key = 'trip:' || trip_uuid::TEXT
WHERE kind = 'trip_change' AND trip_uuid IS NOT NULL;

-- Eén open melding per reis en ontvanger. Een volgende wijziging werkt die
-- melding bij; na wegklikken kan een latere wijziging haar opnieuw openen.
CREATE OR REPLACE FUNCTION private.notify_trip_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_trip UUID; v_owner UUID; v_actor UUID; v_name TEXT; v_actor_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND
    (to_jsonb(NEW) - 'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'DELETE' THEN v_trip := OLD.trip_uuid; ELSE v_trip := NEW.trip_uuid; END IF;
  SELECT workspace_user_id, name INTO v_owner, v_name FROM public.trips WHERE trip_uuid = v_trip;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_actor := COALESCE(auth.uid(), v_owner);
  SELECT COALESCE(NULLIF(display_name, ''), 'Een reisgenoot') INTO v_actor_name
  FROM public.profiles WHERE id = v_actor;
  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  SELECT DISTINCT member.user_id, 'trip_change', 'Reis bijgewerkt',
    COALESCE(v_actor_name, 'Een reisgenoot') || ' heeft ' || v_name || ' gewijzigd.',
    v_trip, 'trip:' || v_trip::TEXT
  FROM public.trip_members AS member
  WHERE member.trip_uuid = v_trip AND member.status = 'active'
    AND member.user_id IS NOT NULL AND member.user_id <> v_actor
  ON CONFLICT (user_id, event_key) DO UPDATE SET
    title = EXCLUDED.title, body = EXCLUDED.body, trip_uuid = EXCLUDED.trip_uuid,
    created_at = now(), dismissed_at = NULL;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_removed_trip_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_trip_name TEXT;
BEGIN
  IF OLD.user_id IS NULL OR OLD.role = 'owner' OR OLD.status <> 'active' THEN RETURN OLD; END IF;
  SELECT name INTO v_trip_name FROM public.trips WHERE trip_uuid = OLD.trip_uuid;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  VALUES (OLD.user_id, 'membership', 'Uit reis verwijderd', COALESCE(v_trip_name, 'Reis'),
    'trip-removed:' || OLD.trip_uuid::TEXT)
  ON CONFLICT (user_id, event_key) DO UPDATE SET
    title = EXCLUDED.title, body = EXCLUDED.body, created_at = now(), dismissed_at = NULL;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trip_members_notify_removal ON public.trip_members;
CREATE TRIGGER trip_members_notify_removal BEFORE DELETE ON public.trip_members
FOR EACH ROW EXECUTE FUNCTION private.notify_removed_trip_member();

CREATE OR REPLACE FUNCTION private.notify_feedback_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  VALUES (NEW.user_id, 'feedback', 'Feedback bijgewerkt', NEW.status || '|' || NEW.title,
    'feedback:' || NEW.id::TEXT || ':' || NEW.status)
  ON CONFLICT (user_id, event_key) DO UPDATE SET
    body = EXCLUDED.body, created_at = now(), dismissed_at = NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS beta_feedback_notify_status ON public.beta_feedback;
CREATE TRIGGER beta_feedback_notify_status AFTER UPDATE OF status ON public.beta_feedback
FOR EACH ROW EXECUTE FUNCTION private.notify_feedback_status();

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('status', 'update')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'resolved')),
  title_nl TEXT NOT NULL CHECK (char_length(title_nl) BETWEEN 3 AND 120),
  title_en TEXT NOT NULL CHECK (char_length(title_en) BETWEEN 3 AND 120),
  body_nl TEXT NOT NULL CHECK (char_length(body_nl) BETWEEN 3 AND 1000),
  body_en TEXT NOT NULL CHECK (char_length(body_en) BETWEEN 3 AND 1000),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_announcements FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_announcements TO service_role;

CREATE OR REPLACE FUNCTION private.notify_platform_announcement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.published_at IS NULL OR OLD.published_at IS NOT NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  SELECT auth_user.id, 'platform', NEW.title_nl,
    NEW.announcement_type || '|' || NEW.severity || '|' || NEW.title_en || '|' || NEW.body_nl || '|' || NEW.body_en,
    'platform:' || NEW.id::TEXT
  FROM auth.users AS auth_user WHERE auth_user.email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS platform_announcements_notify ON public.platform_announcements;
CREATE TRIGGER platform_announcements_notify AFTER UPDATE OF published_at ON public.platform_announcements
FOR EACH ROW EXECUTE FUNCTION private.notify_platform_announcement();

REVOKE ALL ON FUNCTION private.notify_removed_trip_member(), private.notify_feedback_status(),
  private.notify_platform_announcement() FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
