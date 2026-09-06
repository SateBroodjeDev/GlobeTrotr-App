-- GlobeTrotr: richer booking data and one consistent traveller source.
-- Run after the earlier GlobeTrotr migrations. This does not delete trips.

BEGIN;

-- Keep a reference between an older itinerary row and the booking that made it.
ALTER TABLE public.trip_itinerary_items
  ADD COLUMN IF NOT EXISTS source_travel_item_id TEXT;

-- Store type-specific, non-sensitive booking values (times, car category,
-- rental terms and fuel estimate inputs) without making each booking type a table.
ALTER TABLE public.trip_travel_items
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.trip_travel_items
  DROP CONSTRAINT IF EXISTS trip_travel_items_item_type_check;
ALTER TABLE public.trip_travel_items
  ADD CONSTRAINT trip_travel_items_item_type_check
  CHECK (item_type IN ('flight', 'lodging', 'transport', 'car_rental', 'activity'));

ALTER TABLE public.trip_expenses
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Existing versions created a plain itinerary record for every booking. Mark
-- unambiguous matches so deletion and the new timeline never leave an orphan.
UPDATE public.trip_itinerary_items AS itinerary
SET source_travel_item_id = booking.id
FROM public.trip_travel_items AS booking
WHERE itinerary.trip_uuid = booking.trip_uuid
  AND itinerary.source_travel_item_id IS NULL
  AND itinerary.day = booking.start_date
  AND itinerary.title = booking.title;

-- workspaces.data is now a compatibility backup. The old workspace-level
-- members array contained sample people and is not an authority for a trip.
UPDATE public.workspaces
SET data = data - 'members'
WHERE data ? 'members';

-- The profile is the authority for the owner label. This fixes old demo names
-- such as Dani without hardcoding a replacement.
UPDATE public.trip_members AS member
SET name = COALESCE(NULLIF(profile.display_name, ''), member.name),
    email = COALESCE(NULLIF(profile.email, ''), member.email)
FROM public.profiles AS profile
WHERE member.role = 'owner'
  AND member.workspace_user_id = profile.id;

-- The legacy travelers JSON is rebuilt from genuine per-trip members only.
UPDATE public.trips AS trip
SET travelers = (
  SELECT COALESCE(
    jsonb_agg(member.name ORDER BY CASE WHEN member.role = 'owner' THEN 0 ELSE 1 END, member.name),
    '[]'::jsonb
  )
  FROM public.trip_members AS member
  WHERE member.trip_uuid = trip.trip_uuid
);

-- Keep the JSON backup aligned during the transition; remove any stale trip
-- traveller list and reconstruct it from trip_members by global UUID.
UPDATE public.workspaces AS workspace
SET data = jsonb_set(
  workspace.data,
  '{trips}',
  COALESCE((
    SELECT jsonb_agg(
      jsonb_set(
        item.trip,
        '{travelers}',
        COALESCE(trip.travelers, '[]'::jsonb),
        true
      )
      ORDER BY item.position
    )
    FROM jsonb_array_elements(COALESCE(workspace.data->'trips', '[]'::jsonb))
      WITH ORDINALITY AS item(trip, position)
    LEFT JOIN public.trips AS trip
      ON trip.workspace_user_id = workspace.user_id
      AND trip.trip_uuid::text = item.trip->>'id'
  ), '[]'::jsonb),
  true
)
WHERE jsonb_typeof(workspace.data->'trips') = 'array';

COMMIT;
