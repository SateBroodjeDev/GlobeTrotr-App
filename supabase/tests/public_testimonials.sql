-- Uitvoeren na 20260908074000_public_testimonials.sql. Alles wordt teruggedraaid.
BEGIN;

INSERT INTO public.testimonials(author_name,author_context_nl,quote_nl,rating,position,published)
VALUES
  ('Zichtbare tester','Betatester','Deze openbare testrecensie bevat voldoende tekst om te worden gepubliceerd.',5,1,true),
  ('Verborgen tester','Interne tester','Deze interne testrecensie mag nooit via de openbare functie verschijnen.',4,2,false);

SET LOCAL ROLE anon;
DO $$
DECLARE v_reviews JSONB;
BEGIN
  SELECT public.list_public_testimonials() INTO v_reviews;
  IF jsonb_array_length(v_reviews) <> 1 OR v_reviews->0->>'authorName' <> 'Zichtbare tester' THEN
    RAISE EXCEPTION 'De openbare recensielijst bevat niet exact de gepubliceerde recensie';
  END IF;
  IF v_reviews::TEXT LIKE '%Verborgen tester%' THEN
    RAISE EXCEPTION 'Een niet-gepubliceerde recensie is openbaar gelekt';
  END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
