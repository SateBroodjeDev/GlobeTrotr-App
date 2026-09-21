BEGIN;

-- Een klantprofiel kan al bestaan voordat de reiziger zich registreert.
-- Verleen toegang pas zodra Supabase het e-mailadres heeft bevestigd.
CREATE INDEX IF NOT EXISTS agency_clients_active_email_lookup_idx
  ON public.agency_clients (lower(email))
  WHERE status = 'active' AND email IS NOT NULL;

-- De bestaande opslag-RPC kon ook een nog onbevestigd account op basis van
-- hetzelfde e-mailadres koppelen. Sla die automatische deelname over; het
-- Auth-trigger hieronder vult haar na bevestiging alsnog aan.
CREATE OR REPLACE FUNCTION private.only_confirmed_agency_client_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.agency_client_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.agency_clients client
    JOIN public.agency_client_trips link ON link.client_id = client.id
      AND link.trip_uuid = NEW.trip_uuid
    JOIN public.trips trip ON trip.trip_uuid = link.trip_uuid
      AND trip.workspace_uuid = client.workspace_uuid
    JOIN auth.users auth_user ON auth_user.id = NEW.user_id
      AND auth_user.email_confirmed_at IS NOT NULL
      AND lower(auth_user.email) = lower(client.email)
    WHERE client.id = NEW.agency_client_id AND client.status = 'active'
      AND NEW.role = 'client' AND NEW.status = 'active'
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.only_confirmed_agency_client_membership()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS only_confirmed_agency_client_membership ON public.trip_members;
CREATE TRIGGER only_confirmed_agency_client_membership
  BEFORE INSERT OR UPDATE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION private.only_confirmed_agency_client_membership();

DELETE FROM public.trip_members member
USING public.agency_clients client, auth.users auth_user
WHERE member.agency_client_id = client.id
  AND member.user_id = auth_user.id
  AND (auth_user.email_confirmed_at IS NULL
    OR lower(auth_user.email) IS DISTINCT FROM lower(client.email)
    OR client.status <> 'active');

CREATE OR REPLACE FUNCTION private.sync_agency_client_access_on_auth_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Trek uitsluitend de door een Agency-klantprofiel verleende rechten in als
  -- het bevestigde adres verandert. Handmatige reisleden blijven bestaan.
  DELETE FROM public.trip_members member
  USING public.agency_clients client
  WHERE member.agency_client_id = client.id
    AND member.user_id = NEW.id
    AND (
      NEW.email_confirmed_at IS NULL
      OR lower(client.email) IS DISTINCT FROM lower(NEW.email)
      OR client.status <> 'active'
    );

  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    INSERT INTO public.trip_members (
      workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
      role, status, invited_at, accepted_at, agency_client_id
    )
    SELECT trip.workspace_user_id, trip.id, trip.trip_uuid,
      'agency-client:' || client.id::TEXT, NEW.id, client.full_name,
      client.email, 'client', 'active', now(), now(), client.id
    FROM public.agency_clients client
    JOIN public.agency_client_trips link ON link.client_id = client.id
    JOIN public.trips trip ON trip.trip_uuid = link.trip_uuid
      AND trip.workspace_uuid = client.workspace_uuid
    WHERE client.status = 'active'
      AND lower(client.email) = lower(NEW.email)
      AND NOT EXISTS (
        SELECT 1 FROM public.trip_members existing
        WHERE existing.trip_uuid = trip.trip_uuid AND existing.user_id = NEW.id
      );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_agency_client_access_on_auth_change()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_agency_client_access_on_auth_change ON auth.users;
CREATE TRIGGER sync_agency_client_access_on_auth_change
  AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.sync_agency_client_access_on_auth_change();

-- Herstel bestaande, bevestigde klantaccounts die na het Agency-profiel zijn
-- aangemaakt. Reeds handmatig toegevoegde leden worden niet aangepast.
INSERT INTO public.trip_members (
  workspace_user_id, trip_id, trip_uuid, id, user_id, name, email,
  role, status, invited_at, accepted_at, agency_client_id
)
SELECT trip.workspace_user_id, trip.id, trip.trip_uuid,
  'agency-client:' || client.id::TEXT, auth_user.id, client.full_name,
  client.email, 'client', 'active', now(), now(), client.id
FROM public.agency_clients client
JOIN public.agency_client_trips link ON link.client_id = client.id
JOIN public.trips trip ON trip.trip_uuid = link.trip_uuid
  AND trip.workspace_uuid = client.workspace_uuid
JOIN auth.users auth_user ON lower(auth_user.email) = lower(client.email)
  AND auth_user.email_confirmed_at IS NOT NULL
WHERE client.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.trip_members existing
    WHERE existing.trip_uuid = trip.trip_uuid AND existing.user_id = auth_user.id
  );

INSERT INTO public.release_checklist_items
  (item_key, category, label_nl, label_en, position)
VALUES (
  'agency.client-register-after-link', 'Agency',
  'Koppel een reis aan een klant vóór registratie: na e-mailbevestiging verschijnt alleen die reis in het klantportaal; controleer ook adreswijziging en archiveren',
  'Link a client trip before registration: after email confirmation only that trip appears in the client portal; also verify email change and archiving',
  226
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
