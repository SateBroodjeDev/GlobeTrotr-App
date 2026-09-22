-- Uitvoeren na 20260908140000_company_mail_image_viewing_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'corporate.mail-html'
      AND label_nl LIKE '%afbeeldingen%'
      AND label_en LIKE '%explicit choice%'
  ) THEN
    RAISE EXCEPTION 'COMPANY_MAIL_IMAGE_VIEWING_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
