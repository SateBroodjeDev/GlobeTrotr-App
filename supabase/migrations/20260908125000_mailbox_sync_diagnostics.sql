BEGIN;
ALTER TABLE public.corporate_mailboxes
  ADD COLUMN IF NOT EXISTS sync_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_error_code TEXT;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('corporate.mail-sync-diagnostics','Corporate Admin',
  'Postvakstatus, laatste synchronisatie, foutcode en veilig opnieuw synchroniseren controleren',
  'Verify mailbox status, last sync, error code and safe resynchronisation',175)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();
COMMIT;
