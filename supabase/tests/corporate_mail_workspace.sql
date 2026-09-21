-- Uitvoeren na 20260908119000_corporate_mail_workspace.sql. Alleen-lezen.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='corporate_mail_drafts') THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_DRAFTS_MISSING';
  END IF;
  IF (SELECT count(*) FROM public.release_checklist_items
    WHERE item_key IN('corporate.mail-workspace','corporate.mail-translation'))<>2 THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_WORKSPACE_CHECKS_MISSING';
  END IF;
  IF has_table_privilege('authenticated','public.corporate_mail_drafts','SELECT') THEN
    RAISE EXCEPTION 'CORPORATE_MAIL_DRAFTS_EXPOSED';
  END IF;
END $$;
