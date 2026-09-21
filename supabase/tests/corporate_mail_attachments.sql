-- Uitvoeren na 20260908121000_corporate_mail_attachments.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='corporate-mail' AND NOT public AND file_size_limit=10485760) THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_BUCKET_MISSING';
 END IF;
 IF has_table_privilege('authenticated','public.corporate_mail_attachments','SELECT')
    OR has_table_privilege('anon','public.corporate_mail_attachments','SELECT') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_ATTACHMENTS_EXPOSED';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.release_checklist_items WHERE item_key='corporate.mail-attachments') THEN
   RAISE EXCEPTION 'CORPORATE_MAIL_ATTACHMENT_ACCEPTANCE_MISSING';
 END IF;
END $$;
