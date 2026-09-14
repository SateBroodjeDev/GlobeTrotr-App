-- Koppel platformstatusupdates aan een incident en sluit oude banners automatisch.
-- Uitvoeren na 20260908027000_invitation_cleanup_and_platform_publish.sql.
BEGIN;

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS status_key UUID;

UPDATE public.platform_announcements
SET status_key = id
WHERE announcement_type = 'status' AND status_key IS NULL;

CREATE INDEX IF NOT EXISTS platform_announcements_status_key_idx
  ON public.platform_announcements(status_key, published_at DESC)
  WHERE announcement_type = 'status';

-- Houd de gemelde weerstoring zichtbaar tot de nieuwe dubbele providerroute
-- in productie is bevestigd. Corporate Admin kan dit daarna oplossen.
INSERT INTO public.known_issues(
  id,title_nl,title_en,description_nl,description_en,category,status,severity,public
) VALUES (
  '5c854f0a-8814-4f0c-9cb6-3cdfa5fce104'::UUID,
  'Weerdata is soms tijdelijk niet beschikbaar',
  'Weather data is sometimes temporarily unavailable',
  'De weerwidget en platformcontrole meldden offline weerdata. Een tweede weerbron en een afzonderlijk gevalideerde route voor openbare reizen zijn gebouwd en worden gemonitord.',
  'The weather widget and platform check reported offline weather data. A second provider and a separately validated route for public trips have been built and are being monitored.',
  'bug','monitoring','medium',true
) ON CONFLICT (id) DO UPDATE SET
  description_nl=EXCLUDED.description_nl, description_en=EXCLUDED.description_en,
  status='monitoring', severity='medium', public=true, archived_at=NULL;

UPDATE public.known_issues SET
  title_nl='Open reisuitnodigingen hebben nog geen afzonderlijk beheer',
  title_en='Pending trip invitations do not have dedicated management yet',
  description_nl='Accepteren, weigeren en automatisch intrekken bij het verwijderen van een reisgenoot werken. Een reisbeheerder heeft nog geen afzonderlijk overzicht om iedere open uitnodiging handmatig in te trekken of met een nieuwe vervaldatum te vernieuwen.',
  description_en='Acceptance, decline and automatic revocation when removing a traveller work. A trip manager does not yet have a separate overview to manually revoke every pending invitation or renew it with a new expiry date.'
WHERE id='5c854f0a-8814-4f0c-9cb6-3cdfa5fce103'::UUID;

-- Geef bestaande statusmeldingen dezelfde incidentcode, zodat ze ook als banner
-- herkenbaar zijn en bij een vervolgbericht gesloten kunnen worden.
UPDATE public.notifications AS notification
SET body = notification.body || '|' || announcement.status_key::TEXT
FROM public.platform_announcements AS announcement
WHERE notification.event_key = 'platform:' || announcement.id::TEXT
  AND announcement.announcement_type = 'status'
  AND array_length(string_to_array(notification.body, '|'), 1) = 5;

CREATE OR REPLACE FUNCTION private.notify_platform_announcement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.published_at IS NULL OR OLD.published_at IS NOT NULL THEN RETURN NEW; END IF;

  IF NEW.announcement_type = 'status' AND NEW.status_key IS NOT NULL THEN
    UPDATE public.notifications AS notification
    SET dismissed_at = COALESCE(notification.dismissed_at, now())
    WHERE notification.kind = 'platform'
      AND split_part(notification.body, '|', 1) = 'status'
      AND split_part(notification.body, '|', 6) = NEW.status_key::TEXT;
  END IF;

  INSERT INTO public.notifications(user_id, kind, title, body, event_key)
  SELECT auth_user.id, 'platform', NEW.title_nl,
    NEW.announcement_type || '|' || NEW.severity || '|' || NEW.title_en || '|' ||
      NEW.body_nl || '|' || NEW.body_en || '|' || COALESCE(NEW.status_key::TEXT, ''),
    'platform:' || NEW.id::TEXT
  FROM auth.users AS auth_user WHERE auth_user.email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_platform_announcement_v2(
  p_actor_id UUID, p_announcement_type TEXT, p_severity TEXT,
  p_title_nl TEXT, p_title_en TEXT, p_body_nl TEXT, p_body_en TEXT,
  p_status_key UUID DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id UUID; v_status_key UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_admins admin
    WHERE admin.user_id = p_actor_id AND admin.active = true) THEN
    RAISE EXCEPTION USING ERRCODE = 'PT403', MESSAGE = 'FORBIDDEN';
  END IF;
  IF p_announcement_type NOT IN ('status','update') OR
     p_severity NOT IN ('info','warning','critical','resolved') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_ANNOUNCEMENT';
  END IF;
  IF p_announcement_type = 'update' AND p_severity = 'resolved' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_ANNOUNCEMENT';
  END IF;
  IF p_status_key IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.platform_announcements announcement
    WHERE announcement.status_key = p_status_key
      AND announcement.announcement_type = 'status'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'UNKNOWN_PLATFORM_STATUS';
  END IF;

  v_id := gen_random_uuid();
  v_status_key := CASE WHEN p_announcement_type = 'status'
    THEN COALESCE(p_status_key, v_id) ELSE NULL END;
  INSERT INTO public.platform_announcements(
    id, announcement_type, severity, title_nl, title_en, body_nl, body_en,
    created_by, status_key
  ) VALUES (
    v_id, p_announcement_type, p_severity, btrim(p_title_nl), btrim(p_title_en),
    btrim(p_body_nl), btrim(p_body_en), p_actor_id, v_status_key
  );
  UPDATE public.platform_announcements SET published_at = now() WHERE id = v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_platform_announcement_v2(
  UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_platform_announcement_v2(
  UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID
) TO service_role;
REVOKE ALL ON FUNCTION private.notify_platform_announcement()
  FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
