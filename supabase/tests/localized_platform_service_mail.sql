-- Uitvoeren na 20260908129000_localized_platform_service_mail.sql.
-- Bewijst de werkelijke NL/EN-payload en draait alle testdata terug.
BEGIN;

CREATE TEMP TABLE platform_mail_test_ids AS
SELECT gen_random_uuid() AS nl_user_id,
  gen_random_uuid() AS en_user_id,
  gen_random_uuid() AS announcement_id;

INSERT INTO auth.users(id,email,email_confirmed_at)
SELECT nl_user_id,'platform-mail-nl@example.invalid',now() FROM platform_mail_test_ids
UNION ALL
SELECT en_user_id,'platform-mail-en@example.invalid',now() FROM platform_mail_test_ids;

UPDATE public.profiles SET locale='nl-NL'
WHERE id=(SELECT nl_user_id FROM platform_mail_test_ids);
UPDATE public.profiles SET locale='en-GB'
WHERE id=(SELECT en_user_id FROM platform_mail_test_ids);

INSERT INTO public.platform_announcements(
  id,announcement_type,severity,title_nl,title_en,body_nl,body_en,created_by,status_key
)
SELECT announcement_id,'status','critical',
  'Nederlandse teststoring','English test incident',
  'Nederlandse uitleg zonder interne code.','English explanation without internal code.',
  nl_user_id,announcement_id
FROM platform_mail_test_ids;

INSERT INTO public.notifications(user_id,kind,title,body,event_key)
SELECT nl_user_id,'platform','Nederlandse teststoring',
  'status|critical|English test incident|Nederlandse uitleg zonder interne code.|English explanation without internal code.|'||announcement_id::TEXT,
  'platform:'||announcement_id::TEXT
FROM platform_mail_test_ids
UNION ALL
SELECT en_user_id,'platform','Nederlandse teststoring',
  'status|critical|English test incident|Nederlandse uitleg zonder interne code.|English explanation without internal code.|'||announcement_id::TEXT,
  'platform:'||announcement_id::TEXT
FROM platform_mail_test_ids;

DO $$
DECLARE v_nl JSONB; v_en JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.email_outbox'::regclass
      AND tgname='localize_platform_email_outbox' AND NOT tgisinternal
  ) THEN RAISE EXCEPTION 'PLATFORM_EMAIL_LOCALIZATION_TRIGGER_MISSING'; END IF;

  SELECT payload INTO v_nl FROM public.email_outbox
  WHERE user_id=(SELECT nl_user_id FROM platform_mail_test_ids);
  SELECT payload INTO v_en FROM public.email_outbox
  WHERE user_id=(SELECT en_user_id FROM platform_mail_test_ids);

  IF v_nl IS NULL OR v_en IS NULL THEN
    RAISE EXCEPTION 'PLATFORM_EMAIL_OUTBOX_ROWS_MISSING';
  END IF;
  IF v_nl->>'title'<>'Nederlandse teststoring'
    OR v_nl->>'body'<>'Nederlandse uitleg zonder interne code.'
    OR v_nl->>'severity'<>'critical'
    OR v_nl->>'announcementType'<>'status' THEN
    RAISE EXCEPTION 'PLATFORM_EMAIL_NL_PAYLOAD_INVALID: %',v_nl;
  END IF;
  IF v_en->>'title'<>'English test incident'
    OR v_en->>'body'<>'English explanation without internal code.'
    OR v_en->>'severity'<>'critical'
    OR v_en->>'announcementType'<>'status' THEN
    RAISE EXCEPTION 'PLATFORM_EMAIL_EN_PAYLOAD_INVALID: %',v_en;
  END IF;
  IF (v_nl->>'body') LIKE '%|%' OR (v_en->>'body') LIKE '%|%' THEN
    RAISE EXCEPTION 'PLATFORM_EMAIL_INTERNAL_CODE_LEAKED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key='mail.platform-localization' AND completed_at IS NULL
  ) THEN RAISE EXCEPTION 'PLATFORM_EMAIL_LOCALIZATION_ACCEPTANCE_MISSING'; END IF;
END;
$$;

ROLLBACK;
