-- Begrens reisnamen op 30 tekens en reisomschrijvingen op 375 tekens.
-- Bestaande langere waarden worden veilig ingekort voordat de constraints ingaan.
-- Uitvoeren na 20260908000000_update_linked_member_roles.sql.
BEGIN;

UPDATE public.trips
SET name = left(name, 30)
WHERE char_length(name) > 30;

UPDATE public.trips
SET description = left(description, 375)
WHERE char_length(description) > 375;

ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_name_length_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_name_length_check
  CHECK (char_length(name) BETWEEN 1 AND 30);

ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_description_length_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_description_length_check
  CHECK (description IS NULL OR char_length(description) <= 375);

COMMIT;

