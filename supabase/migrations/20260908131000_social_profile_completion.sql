BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('auth.social-profile-completion','Accounts en toegang','Nieuw sociaal account: eenmalig profiel aanvullen en profielfoto controleren','New social account: complete profile once and check avatar upload',142)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
