BEGIN;

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  page_url TEXT CHECK (char_length(page_url) <= 500),
  browser_info TEXT CHECK (char_length(browser_info) <= 500),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','planned','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.known_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_nl TEXT NOT NULL CHECK (char_length(title_nl) BETWEEN 3 AND 160),
  title_en TEXT NOT NULL CHECK (char_length(title_en) BETWEEN 3 AND 160),
  description_nl TEXT NOT NULL CHECK (char_length(description_nl) BETWEEN 3 AND 2000),
  description_en TEXT NOT NULL CHECK (char_length(description_en) BETWEEN 3 AND 2000),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating','planned','monitoring','resolved')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  public BOOLEAN NOT NULL DEFAULT true,
  github_issue_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users submit own feedback" ON public.beta_feedback;
CREATE POLICY "Users submit own feedback" ON public.beta_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Corporate admins manage feedback" ON public.beta_feedback;
CREATE POLICY "Corporate admins manage feedback" ON public.beta_feedback FOR ALL TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'corporate_admin')::BOOLEAN, false))
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'corporate_admin')::BOOLEAN, false));
DROP POLICY IF EXISTS "Public reads published known issues" ON public.known_issues;
CREATE POLICY "Public reads published known issues" ON public.known_issues FOR SELECT TO anon, authenticated
  USING (public = true OR COALESCE((auth.jwt()->'app_metadata'->>'corporate_admin')::BOOLEAN, false));
DROP POLICY IF EXISTS "Corporate admins manage known issues" ON public.known_issues;
CREATE POLICY "Corporate admins manage known issues" ON public.known_issues FOR ALL TO authenticated
  USING (COALESCE((auth.jwt()->'app_metadata'->>'corporate_admin')::BOOLEAN, false))
  WITH CHECK (COALESCE((auth.jwt()->'app_metadata'->>'corporate_admin')::BOOLEAN, false));

REVOKE ALL ON public.beta_feedback, public.known_issues FROM anon, authenticated;
GRANT INSERT ON public.beta_feedback TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.beta_feedback TO authenticated;
GRANT SELECT ON public.known_issues TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.known_issues TO authenticated;
COMMIT;
