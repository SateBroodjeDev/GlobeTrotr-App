-- Uitvoeren na 20260908136000_translation_draft_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key='content.translation'
      AND label_nl LIKE '%EN→NL%'
      AND label_nl LIKE '%feedback%'
      AND label_en LIKE '%testimonials%'
  ) THEN
    RAISE EXCEPTION 'TRANSLATION_DRAFT_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
