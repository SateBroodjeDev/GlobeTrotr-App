-- Beheerbare, expliciet gepubliceerde recensies voor de publieke website.
-- Uitvoeren na 20260908073000_refresh_known_beta_issues.sql.
BEGIN;

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 80),
  author_context_nl TEXT CHECK (author_context_nl IS NULL OR char_length(author_context_nl) <= 120),
  author_context_en TEXT CHECK (author_context_en IS NULL OR char_length(author_context_en) <= 120),
  quote_nl TEXT NOT NULL CHECK (char_length(quote_nl) BETWEEN 20 AND 600),
  quote_en TEXT CHECK (quote_en IS NULL OR char_length(quote_en) BETWEEN 20 AND 600),
  rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 10000),
  published BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.testimonials FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

CREATE OR REPLACE FUNCTION public.list_public_testimonials()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', review.id,
    'authorName', review.author_name,
    'authorContextNl', COALESCE(review.author_context_nl, ''),
    'authorContextEn', COALESCE(review.author_context_en, ''),
    'quoteNl', review.quote_nl,
    'quoteEn', COALESCE(review.quote_en, review.quote_nl),
    'rating', review.rating
  ) ORDER BY review.position, review.created_at DESC), '[]'::JSONB)
  FROM public.testimonials AS review
  WHERE review.published = true AND review.archived_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.list_public_testimonials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_testimonials() TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
