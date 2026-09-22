BEGIN;

ALTER TABLE public.corporate_mail_attachments
  ADD COLUMN content_id TEXT CHECK (content_id IS NULL OR char_length(content_id) BETWEEN 1 AND 255);

CREATE INDEX corporate_mail_attachments_inline_idx
  ON public.corporate_mail_attachments(message_id, content_id)
  WHERE content_id IS NOT NULL;

-- Email signatures commonly use GIF logos; incoming files still pass ClamAV.
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'image/gif')
WHERE id = 'corporate-mail'
  AND NOT ('image/gif' = ANY(allowed_mime_types));

UPDATE public.release_checklist_items
SET label_nl = 'Inkomende HTML-mail: meegestuurde afbeeldingen na malwarescan inline tonen; externe afbeeldingen blijven optioneel en lange mails passen in het leesvenster',
    label_en = 'Received HTML email: show scanned attached images inline; external images remain optional and long messages fit the reading area',
    updated_at = now()
WHERE item_key = 'corporate.mail-html';

COMMIT;
