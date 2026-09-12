-- Bruikbare interne mailboxworkflow; verzending blijft door de VPS-worker bepaald.
-- Uitvoeren na 20260908067000_corporate_business_operations.sql.
BEGIN;

CREATE TABLE public.corporate_mail_send_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  in_reply_to_message_id UUID REFERENCES public.corporate_mail_messages(id) ON DELETE SET NULL,
  recipient_addresses TEXT[] NOT NULL CHECK (cardinality(recipient_addresses) BETWEEN 1 AND 25),
  cc_addresses TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(cc_addresses) <= 25),
  subject TEXT NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 500),
  body_text TEXT NOT NULL CHECK (char_length(btrim(body_text)) BETWEEN 1 AND 50000),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','pending','processing','sent','failed','cancelled')),
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX corporate_mail_send_queue_worker_idx ON public.corporate_mail_send_queue(status,available_at) WHERE status IN ('pending','failed');

CREATE TABLE public.corporate_mail_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.corporate_mail_messages(id) ON DELETE CASCADE,
  send_queue_id UUID REFERENCES public.corporate_mail_send_queue(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL CHECK (storage_key !~ '(^|/)[.][.]($|/)'),
  file_name TEXT NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  content_type TEXT NOT NULL CHECK (char_length(content_type) BETWEEN 1 AND 150),
  size_bytes BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 26214400),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((message_id IS NOT NULL)::INTEGER + (send_queue_id IS NOT NULL)::INTEGER = 1)
);

CREATE OR REPLACE FUNCTION public.claim_corporate_mail_queue(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.corporate_mail_send_queue LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  RETURN QUERY UPDATE public.corporate_mail_send_queue q SET status='processing',claimed_at=now(),attempts=q.attempts+1,updated_at=now()
  WHERE q.id IN (SELECT item.id FROM public.corporate_mail_send_queue item WHERE item.status IN('pending','failed') AND item.available_at<=now() AND item.attempts<10 ORDER BY item.available_at,item.created_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),50))
  RETURNING q.*;
END $$;

ALTER TABLE public.corporate_mail_send_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_mail_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corporate_mail_send_queue,public.corporate_mail_attachments FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.corporate_mail_send_queue,public.corporate_mail_attachments TO service_role;
REVOKE ALL ON FUNCTION public.claim_corporate_mail_queue(INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_corporate_mail_queue(INTEGER) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
