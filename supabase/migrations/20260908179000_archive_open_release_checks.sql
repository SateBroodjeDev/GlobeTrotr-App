BEGIN;

ALTER TABLE public.release_checklist_items
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archive_reason TEXT;

ALTER TABLE public.release_checklist_items
  ADD CONSTRAINT release_checklist_archive_reason_check
  CHECK(archive_reason IS NULL OR char_length(archive_reason) <= 240);

UPDATE public.release_checklist_items
SET archived_at = now(),
    archive_reason = 'Opgeschoond voor een nieuwe release-1.0-acceptatieronde',
    updated_at = now()
WHERE completed_at IS NULL AND archived_at IS NULL;

CREATE INDEX release_checklist_active_position_idx
  ON public.release_checklist_items(position)
  WHERE archived_at IS NULL;

COMMIT;
