-- Uitvoeren na 20260908168000_corporate_mail_management_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'corporate.mail-management'
      AND label_nl LIKE '%definitief verwijderen%'
      AND label_en LIKE '%full screen%'
  ) THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_MANAGEMENT_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
