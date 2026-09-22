BEGIN;

ALTER TABLE public.privacy_requests
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS privacy_requests_active_due_idx
  ON public.privacy_requests(due_at)
  WHERE archived_at IS NULL;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-html','Corporate Admin',
 'Inkomende HTML-mail: lange inhoud, meegestuurde afbeeldingen na malwarescan en externe afbeeldingen alleen na bewuste keuze testen',
 'Received HTML email: test long messages, scanned attached images and external images only after an explicit choice',189),
('corporate.governance','Corporate Admin',
 'Intern incident aanmaken, wijzigen en oplossen; afgerond privacyverzoek archiveren en herstellen',
 'Create, edit and resolve an internal incident; archive and restore a completed privacy request',86)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
