-- Maak publieke contactberichten veilig afhandelbaar vanuit Corporate Admin.
BEGIN;
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx ON public.contact_messages(status,created_at DESC);
COMMIT;
