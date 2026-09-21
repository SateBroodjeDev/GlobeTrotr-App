-- Uitvoeren na 20260908137000_branded_html_signature_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.corporate_mailboxes WHERE active AND signature_text IS NULL) THEN
    RAISE EXCEPTION 'ACTIVE_MAILBOX_SIGNATURE_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.release_checklist_items
    WHERE item_key='corporate.mail-branding'
      AND label_nl LIKE '%tekstfallback%'
      AND label_en LIKE '%HTML signature%'
  ) THEN
    RAISE EXCEPTION 'BRANDED_HTML_SIGNATURE_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
