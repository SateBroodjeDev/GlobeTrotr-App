-- Uitvoeren na 20260908085000_account_security_acceptance.sql. Alleen-lezen.
DO $$
BEGIN
  IF (
    SELECT count(*) FROM public.release_checklist_items
    WHERE item_key IN('account.email-change-notification','account.password-change-notification')
  ) <> 2 THEN
    RAISE EXCEPTION 'ACCOUNT_SECURITY_ACCEPTANCE_ITEMS_MISSING';
  END IF;
END;
$$;
