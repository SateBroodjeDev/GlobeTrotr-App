BEGIN;
ALTER TABLE public.beta_feedback ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.known_issues ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS beta_feedback_archived_at_idx ON public.beta_feedback(archived_at);
CREATE INDEX IF NOT EXISTS known_issues_archived_at_idx ON public.known_issues(archived_at);
COMMIT;
