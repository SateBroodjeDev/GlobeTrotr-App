-- Eenmalig uitvoeren nadat migratie 720 is toegepast.
-- Legt uitsluitend de door de eigenaar bevestigde technische controles vast.
-- Handmatige product- en acceptatietests blijven open.
BEGIN;

UPDATE public.release_checklist_items
SET completed_at = now(),
    completed_by = NULL,
    notes = CASE item_key
      WHEN 'db.migrations' THEN
        'Migraties tot en met 720 zijn handmatig in de productie-beta uitgevoerd.'
      WHEN 'db.tests' THEN
        'De beschikbare SQL-regressietests zijn zonder fouten uitgevoerd.'
      WHEN 'data.clean-start' THEN
        'Gebruikersdata is gecontroleerd gereset; een nieuw account en Corporate Admin-toegang werken.'
    END,
    updated_at = now()
WHERE item_key IN ('db.migrations', 'db.tests', 'data.clean-start');

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.release_checklist_items
    WHERE item_key IN ('db.migrations', 'db.tests', 'data.clean-start')
      AND completed_at IS NOT NULL
  ) <> 3 THEN
    RAISE EXCEPTION 'TECHNICAL_CHECKLIST_UPDATE_INCOMPLETE';
  END IF;
END;
$$;

COMMIT;

