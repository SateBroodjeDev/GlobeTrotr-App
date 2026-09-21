BEGIN;

-- Supabase Auth-templates lezen deze niet-beveiligingsgevoelige voorkeur uit
-- user_metadata. Autorisatie blijft uitsluitend op app_metadata/RLS steunen.
UPDATE auth.users AS u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::JSONB)
  || jsonb_build_object(
    'language',
    CASE WHEN p.locale = 'nl-NL' THEN 'nl' ELSE 'en' END
  )
FROM public.profiles AS p
WHERE p.id = u.id
  AND COALESCE(u.raw_user_meta_data->>'language', '') IS DISTINCT FROM
    CASE WHEN p.locale = 'nl-NL' THEN 'nl' ELSE 'en' END;

CREATE OR REPLACE FUNCTION private.sync_auth_email_language()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.locale IS DISTINCT FROM OLD.locale THEN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::JSONB)
      || jsonb_build_object(
        'language',
        CASE WHEN NEW.locale = 'nl-NL' THEN 'nl' ELSE 'en' END
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_auth_email_language() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.sync_auth_email_language() TO service_role;

DROP TRIGGER IF EXISTS sync_auth_email_language ON public.profiles;
CREATE TRIGGER sync_auth_email_language
AFTER UPDATE OF locale ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.sync_auth_email_language();

INSERT INTO public.release_checklist_items(
  item_key, category, label_nl, label_en, position
) VALUES (
  'mail.auth-localization',
  'Communicatie',
  'Registratie, herstel, magic link, uitnodiging en e-mailwijziging ieder in de gekozen taal controleren',
  'Verify signup, recovery, magic link, invitation and email change each use the selected language',
  130
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
