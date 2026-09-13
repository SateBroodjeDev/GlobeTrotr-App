-- Maak publieke contactberichten veilig afhandelbaar vanuit Corporate Admin.
BEGIN;
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'question'
    CHECK(category IN('question','support','feedback','complaint','privacy','billing','agency'));
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx ON public.contact_messages(status,created_at DESC);
UPDATE public.release_checklist_items SET label_nl='Contact, feedbackcategorieën, Turnstile, ontvangst en beheerinbox controleren',label_en='Verify contact, feedback categories, Turnstile, receipt and management inbox',updated_at=now() WHERE item_key='public.contact';
COMMIT;
