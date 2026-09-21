BEGIN;

CREATE TABLE public.corporate_mail_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE CHECK(storage_key !~ '(^|/)[.][.]($|/)'),
  file_name TEXT NOT NULL CHECK(char_length(file_name) BETWEEN 1 AND 255),
  content_type TEXT NOT NULL CHECK(char_length(content_type) BETWEEN 1 AND 150),
  size_bytes BIGINT NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760),
  sha256 TEXT NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX corporate_mail_uploads_expiry_idx ON public.corporate_mail_uploads(expires_at);
ALTER TABLE public.corporate_mail_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corporate_mail_uploads FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.corporate_mail_uploads TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES(
  'corporate.mail-upload-cleanup','Bedrijf',
  'Bedrijfsmail: afgebroken bijlage-uploads na twee uur veilig opruimen',
  'Company mail: safely clean abandoned attachment uploads after two hours',172
)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
