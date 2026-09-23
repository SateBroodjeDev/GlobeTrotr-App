BEGIN;

-- 1490 kan al zijn uitgevoerd; bewaar de nieuwe categorievelden apart.
ALTER TABLE public.trip_travel_options
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::JSONB;

UPDATE public.release_checklist_items
SET label_nl = 'Open Reisvergelijker op mobiel en desktop: voeg per categorie een kandidaat toe met passende velden (vlucht, verblijf, vervoer, huurauto en activiteit); vergelijk maximaal vier; controleer valuta, bron, archiveren, viewerrechten en precies één boeking na kiezen',
    label_en = 'Open Trip comparison on mobile and desktop: add a candidate with relevant fields for each category (flight, accommodation, transport, rental car and activity); compare up to four; verify currency, source, archiving, viewer access and exactly one booking after choosing',
    updated_at = now()
WHERE item_key = 'trip.options-comparison';

COMMIT;
