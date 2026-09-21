-- Uitvoeren na 20260908118000_beta_mail_and_billing_reliability.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='corporate_mail_messages' AND column_name='body_html'
  ) THEN RAISE EXCEPTION 'CORPORATE_MAIL_HTML_MISSING'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='corporate_mail_send_queue' AND column_name='body_html'
  ) THEN RAISE EXCEPTION 'CORPORATE_MAIL_QUEUE_HTML_MISSING'; END IF;
  IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN
    ('beta.mail-invites','beta.mail-format','beta.staff-save','beta.agency-link',
     'beta.gpx-ics','beta.paddle-entitlement','beta.corporate-html',
     'beta.mail-language','beta.public-schedule','beta.expense-payer',
     'beta.linux-build','beta.typecheck','beta.public-smoke','beta.contact-security',
     'beta.redirect-security','beta.serverfn-security','beta.corporate-editor')) <> 17
  THEN RAISE EXCEPTION 'BETA_ACCEPTANCE_ITEMS_MISSING'; END IF;
END $$;
