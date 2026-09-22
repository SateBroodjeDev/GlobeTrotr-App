-- Uitvoeren na 20260908143000_account_ui_and_signature_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.release_checklist_items
      WHERE item_key IN ('corporate.mail-signature-admin','account.security-dialogs','public.production-copy')) <> 3 THEN
    RAISE EXCEPTION 'ACCOUNT_UI_SIGNATURE_ACCEPTANCE_MISSING';
  END IF;
END;
$$;
