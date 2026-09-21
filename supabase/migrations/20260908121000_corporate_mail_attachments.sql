BEGIN;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES(
  'corporate-mail','corporate-mail',false,10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT(id) DO UPDATE SET
  public=false,
  file_size_limit=10485760,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

CREATE INDEX IF NOT EXISTS corporate_mail_attachments_message_idx
  ON public.corporate_mail_attachments(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS corporate_mail_attachments_queue_idx
  ON public.corporate_mail_attachments(send_queue_id) WHERE send_queue_id IS NOT NULL;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES(
  'corporate.mail-attachments','Bedrijf',
  'Bedrijfsmail: veilige bijlage verzenden, ontvangen, downloaden en autorisatie controleren',
  'Company mail: verify secure attachment sending, receiving, downloading and authorisation',171
)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
