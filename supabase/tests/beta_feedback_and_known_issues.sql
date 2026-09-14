-- Uitvoeren na 20260908016000_beta_feedback_and_known_issues.sql.
BEGIN;
CREATE TEMP TABLE beta_admin_ids AS SELECT gen_random_uuid() user_id, gen_random_uuid() admin_id;
GRANT SELECT ON beta_admin_ids TO authenticated, anon;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data)
SELECT user_id,user_id::text||'@example.invalid',now(),'{}'::jsonb FROM beta_admin_ids
UNION ALL SELECT admin_id,admin_id::text||'@example.invalid',now(),'{"corporate_admin":true}'::jsonb FROM beta_admin_ids;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',user_id::text,true), set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'app_metadata','{}'::jsonb)::text,true) FROM beta_admin_ids;
INSERT INTO public.beta_feedback(user_id,title,description) SELECT user_id,'Testfeedback','Dit is voldoende lange feedback.' FROM beta_admin_ids;
DO $$ BEGIN IF (SELECT count(*) FROM public.beta_feedback) <> 0 THEN RAISE EXCEPTION 'Tester mag feedback van zichzelf niet teruglezen'; END IF; END $$;
RESET ROLE;

INSERT INTO public.known_issues(title_nl,title_en,description_nl,description_en,public)
VALUES ('Openbaar probleem','Public issue','Beschrijving','Description',true),
('Intern probleem','Internal issue','Beschrijving','Description',false);
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.known_issues
      WHERE title_nl IN ('Openbaar probleem','Intern probleem')) <> 1
    OR NOT EXISTS(SELECT 1 FROM public.known_issues WHERE title_nl='Openbaar probleem')
    OR EXISTS(SELECT 1 FROM public.known_issues WHERE title_nl='Intern probleem')
  THEN RAISE EXCEPTION 'Anon ziet de testproblemen niet volgens hun openbare status'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
