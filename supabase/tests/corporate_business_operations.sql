-- Uitvoeren na 20260908067000_corporate_business_operations.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.corporate_mailboxes WHERE address='info@globetrotr.nl' AND mailbox_type='shared') THEN RAISE EXCEPTION 'Info-mailbox ontbreekt'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.corporate_mailboxes WHERE address='privacy@globetrotr.nl' AND mailbox_type='shared') THEN RAISE EXCEPTION 'Privacy-mailbox ontbreekt'; END IF;
  IF has_table_privilege('authenticated','public.corporate_mail_messages','SELECT') OR has_table_privilege('anon','public.corporate_invoices','SELECT') THEN RAISE EXCEPTION 'Interne bedrijfsdata is rechtstreeks leesbaar'; END IF;
  BEGIN
    INSERT INTO public.corporate_mailboxes(address,display_name,mailbox_type) VALUES('fout@example.com','Fout','shared');
    RAISE EXCEPTION 'Extern mailboxdomein werd geaccepteerd';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO public.corporate_invoices(invoice_number,customer_name,currency,subtotal_minor,tax_minor,total_minor,status)
  VALUES('TEST-2026-001','Testklant','EUR',1000,210,1210,'paid');
  IF (SELECT total_minor FROM public.corporate_invoices WHERE invoice_number='TEST-2026-001')<>1210 THEN RAISE EXCEPTION 'Factuurbedrag klopt niet'; END IF;
END $$;
ROLLBACK;
