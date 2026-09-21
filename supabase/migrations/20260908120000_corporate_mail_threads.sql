BEGIN;

CREATE INDEX IF NOT EXISTS corporate_mail_messages_thread_idx
  ON public.corporate_mail_messages(mailbox_id,thread_key,received_at);

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-threads','Bedrijf','Bedrijfsmail: ontvangen en verzonden antwoorden als één gesprek tonen en beantwoorden','Company mail: group received and sent replies into one conversation and reply',170)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
