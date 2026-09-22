-- Uitvoeren na 20260908141000_company_mail_inline_images.sql. Alleen-lezen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'corporate_mail_attachments'
      AND column_name = 'content_id'
  ) THEN RAISE EXCEPTION 'INLINE_MAIL_CONTENT_ID_MISSING'; END IF;
  IF has_table_privilege('authenticated', 'public.corporate_mail_attachments', 'SELECT') THEN
    RAISE EXCEPTION 'INLINE_MAIL_ATTACHMENTS_EXPOSED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key = 'corporate.mail-html' AND label_en LIKE '%scanned attached images%'
  ) THEN RAISE EXCEPTION 'INLINE_MAIL_ACCEPTANCE_MISSING'; END IF;
END;
$$;
