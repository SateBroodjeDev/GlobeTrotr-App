-- Voeg optionele documentvervaldata toe voor de Agency-werkvoorraad.
-- Uitvoeren na 20260908039000_secure_trip_documents.sql.
BEGIN;
ALTER TABLE public.trip_documents ADD COLUMN IF NOT EXISTS expires_on DATE;
CREATE INDEX IF NOT EXISTS trip_documents_expiry_idx
  ON public.trip_documents(trip_uuid,expires_on) WHERE expires_on IS NOT NULL;

CREATE OR REPLACE FUNCTION private.validate_trip_document_scope()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.trips trip
    WHERE trip.workspace_user_id=NEW.workspace_user_id AND trip.id=NEW.trip_id
      AND trip.trip_uuid=NEW.trip_uuid) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TRIP_DOCUMENT_SCOPE_MISMATCH';
  END IF;
  IF NEW.travel_item_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.trip_travel_items item
    WHERE item.workspace_user_id=NEW.workspace_user_id AND item.trip_id=NEW.trip_id
      AND item.trip_uuid=NEW.trip_uuid AND item.id=NEW.travel_item_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='TRIP_DOCUMENT_TRAVEL_ITEM_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_trip_document_scope ON public.trip_documents;
CREATE TRIGGER validate_trip_document_scope BEFORE INSERT OR UPDATE ON public.trip_documents
FOR EACH ROW EXECUTE FUNCTION private.validate_trip_document_scope();
REVOKE ALL ON FUNCTION private.validate_trip_document_scope() FROM PUBLIC,anon,authenticated;
COMMIT;
