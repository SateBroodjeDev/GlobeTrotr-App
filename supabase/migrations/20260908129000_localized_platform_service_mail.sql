BEGIN;

-- Platformmeldingen gebruiken intern een gestructureerde notificatiebody.
-- Maak voor elke ontvanger in de mailwachtrij een losse, leesbare taalversie.
CREATE OR REPLACE FUNCTION private.localize_platform_email_outbox()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_announcement public.platform_announcements%ROWTYPE;
BEGIN
  IF NEW.template_key <> 'platform' OR NEW.notification_id IS NULL THEN RETURN NEW; END IF;
  SELECT announcement.* INTO v_announcement
  FROM public.notifications notification
  JOIN public.platform_announcements announcement
    ON notification.event_key = 'platform:' || announcement.id::TEXT
  WHERE notification.id = NEW.notification_id;
  IF FOUND THEN
    NEW.payload := NEW.payload || jsonb_build_object(
      'title', left(CASE WHEN NEW.locale = 'en' THEN v_announcement.title_en
        ELSE v_announcement.title_nl END, 120),
      'body', left(CASE WHEN NEW.locale = 'en' THEN v_announcement.body_en
        ELSE v_announcement.body_nl END, 750),
      'severity', v_announcement.severity,
      'announcementType', v_announcement.announcement_type
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.localize_platform_email_outbox()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS localize_platform_email_outbox ON public.email_outbox;
CREATE TRIGGER localize_platform_email_outbox
  BEFORE INSERT OR UPDATE OF payload, locale ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION private.localize_platform_email_outbox();

-- Bestaande niet-verstuurde berichten krijgen alsnog de juiste taalversie.
UPDATE public.email_outbox SET payload = payload, updated_at = now()
WHERE template_key = 'platform' AND status IN ('held', 'pending', 'failed');

INSERT INTO public.release_checklist_items
  (item_key, category, label_nl, label_en, position)
VALUES (
  'mail.platform-localization', 'Communicatie',
  'Publiceer teststoringen in NL en EN: controleer mailonderwerp, leesbare HTML, statuslink en begrijpelijke pop-up in beide talen',
  'Publish test incidents in Dutch and English: verify email subject, readable HTML, status link and understandable toast in both languages',
  234
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
