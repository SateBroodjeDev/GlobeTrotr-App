-- Uitvoeren na 20260908126000_paddle_account_diagnostics_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items
   WHERE item_key='billing.paddle-account-diagnosis' AND completed_at IS NULL) THEN
   RAISE EXCEPTION 'PADDLE_ACCOUNT_DIAGNOSIS_CHECK_MISSING';
 END IF;
END $$;
