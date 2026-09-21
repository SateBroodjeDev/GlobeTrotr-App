-- Uitvoeren na 20260908130000_auth_email_locale.sql. Alles wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE auth_locale_ids AS
SELECT gen_random_uuid() AS user_id;

INSERT INTO auth.users(id, email, email_confirmed_at, raw_user_meta_data)
SELECT user_id, user_id::TEXT || '@example.invalid', now(), '{"language":"en"}'::JSONB
FROM auth_locale_ids;

UPDATE public.profiles
SET locale = 'en-GB'
WHERE id = (SELECT user_id FROM auth_locale_ids);

UPDATE public.profiles
SET locale = 'nl-NL'
WHERE id = (SELECT user_id FROM auth_locale_ids);

DO $$
BEGIN
  IF (SELECT raw_user_meta_data->>'language' FROM auth.users
      WHERE id = (SELECT user_id FROM auth_locale_ids)) <> 'nl' THEN
    RAISE EXCEPTION 'AUTH_EMAIL_LANGUAGE_NOT_SYNCED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'mail.auth-localization'
  ) THEN
    RAISE EXCEPTION 'AUTH_EMAIL_LOCALIZATION_ACCEPTANCE_MISSING';
  END IF;
END;
$$;

ROLLBACK;
