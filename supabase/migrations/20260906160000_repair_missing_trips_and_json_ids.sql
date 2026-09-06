-- GlobeTrotr: herstel reizen die tijdens de JSON -> SQL-overgang zijn gemaakt.
--
-- Voer uit NA 20260906150000_add_global_trip_uuid_and_collaboration_rls.sql.
-- Dit script verwijdert geen JSON. Het maakt ontbrekende parent-reizen aan en
-- vervangt tijdelijke browser-ID's in workspaces.data door de vaste trip_uuid.

BEGIN;

-- Een reis die alleen in workspace.data staat (zoals een tijdelijke ID van
-- acht tekens) krijgt alsnog een relationele parent-rij. De bestaande trigger
-- vult trip_uuid in en maakt het eigenaar-lid aan.
INSERT INTO public.trips (
  workspace_user_id, id, name, template, start_date, end_date, budget,
  travelers, archived, is_public, share_financials, share_pin_hash
)
SELECT
  workspace.user_id,
  trip->>'id',
  COALESCE(NULLIF(trip->>'name', ''), 'Naamloze reis'),
  COALESCE(NULLIF(trip->>'template', ''), 'citytrip'),
  NULLIF(trip->>'start', '')::DATE,
  NULLIF(trip->>'end', '')::DATE,
  COALESCE(NULLIF(trip->>'budget', '')::NUMERIC, 0),
  COALESCE(trip->'travelers', '[]'::jsonb),
  COALESCE(NULLIF(trip->>'archived', '')::BOOLEAN, false),
  COALESCE(NULLIF(trip->>'public', '')::BOOLEAN, false),
  COALESCE(NULLIF(trip->>'shareFinancials', '')::BOOLEAN, false),
  NULLIF(trip->>'sharePinHash', '')
FROM public.workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
WHERE trip ? 'id'
ON CONFLICT (workspace_user_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  template = EXCLUDED.template,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  budget = EXCLUDED.budget,
  travelers = EXCLUDED.travelers,
  archived = EXCLUDED.archived,
  is_public = EXCLUDED.is_public,
  share_financials = EXCLUDED.share_financials,
  share_pin_hash = EXCLUDED.share_pin_hash;

-- De app gebruikt voortaan de globale UUID in routes en bij nieuwe writes.
-- De legacy trips.id blijft bestaan voor bestaande child foreign keys en oude
-- publieke URLs, maar wordt niet langer naar de browser teruggeschreven.
UPDATE public.workspaces AS workspace
SET data = jsonb_set(
  workspace.data,
  '{trips}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN stored.trip_uuid IS NULL THEN item.trip
          ELSE jsonb_set(item.trip, '{id}', to_jsonb(stored.trip_uuid::text), true)
        END
        ORDER BY item.position
      )
      FROM jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb))
        WITH ORDINALITY AS item(trip, position)
      LEFT JOIN public.trips AS stored
        ON stored.workspace_user_id = workspace.user_id
        AND (
          stored.id = item.trip->>'id'
          OR stored.trip_uuid::text = item.trip->>'id'
        )
    ),
    '[]'::jsonb
  ),
  true
)
WHERE jsonb_typeof(workspace.data->'trips') = 'array';

COMMIT;

-- Verwachte uitkomst: nul rijen. Hiermee controleer je of alle JSON-reizen
-- nu een relationele tegenhanger met globale UUID hebben.
-- SELECT workspace.user_id, trip->>'id' AS json_trip_id
-- FROM public.workspaces AS workspace
-- CROSS JOIN LATERAL jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb)) AS trip
-- LEFT JOIN public.trips AS stored
--   ON stored.workspace_user_id = workspace.user_id
--   AND stored.trip_uuid::text = trip->>'id'
-- WHERE stored.trip_uuid IS NULL;
