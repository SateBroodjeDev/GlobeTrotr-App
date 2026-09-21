-- Uitvoeren na 20260908131000_social_profile_completion.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed_at') THEN RAISE EXCEPTION 'SOCIAL_PROFILE_COMPLETION_COLUMN_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='auth.social-profile-completion') THEN RAISE EXCEPTION 'SOCIAL_PROFILE_COMPLETION_CHECK_MISSING'; END IF;
END $$;
