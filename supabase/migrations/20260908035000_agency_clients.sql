-- Klantprofielen voor Agency, gescheiden van interne workspaceleden en reisuitnodigingen.
-- Uitvoeren na 20260908034000_trip_branding_overrides.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agency_clients(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK(char_length(full_name) BETWEEN 1 AND 100),
  email TEXT CHECK(email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone TEXT CHECK(phone IS NULL OR char_length(phone) BETWEEN 3 AND 40),
  locale TEXT NOT NULL DEFAULT 'nl' CHECK(locale IN('nl','en')),
  notes TEXT CHECK(notes IS NULL OR char_length(notes)<=2000),
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(jsonb_typeof(preferences)='object'),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS agency_clients_workspace_email_idx
  ON public.agency_clients(workspace_uuid,lower(email)) WHERE email IS NOT NULL AND status='active';
CREATE INDEX IF NOT EXISTS agency_clients_workspace_status_idx ON public.agency_clients(workspace_uuid,status,full_name);

CREATE TABLE IF NOT EXISTS public.agency_client_trips(
  client_id UUID NOT NULL REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY(client_id,trip_uuid)
);

CREATE OR REPLACE FUNCTION private.validate_agency_client_trip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.agency_clients client JOIN public.trips trip ON trip.trip_uuid=NEW.trip_uuid
    WHERE client.id=NEW.client_id AND client.workspace_uuid=trip.workspace_uuid
  ) THEN RAISE EXCEPTION 'CLIENT_TRIP_WORKSPACE_MISMATCH'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS agency_client_trip_workspace_check ON public.agency_client_trips;
CREATE TRIGGER agency_client_trip_workspace_check BEFORE INSERT OR UPDATE ON public.agency_client_trips
FOR EACH ROW EXECUTE FUNCTION private.validate_agency_client_trip();

-- Sla het profiel en de volledige set reiskoppelingen atomair op. Zo blijft
-- een bestaand profiel intact wanneer een van de gekozen reizen ongeldig is.
CREATE OR REPLACE FUNCTION public.save_agency_client(
  p_actor_id UUID,
  p_workspace_uuid UUID,
  p_client_id UUID,
  p_client JSONB,
  p_trip_ids UUID[] DEFAULT ARRAY[]::UUID[]
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_client_id UUID; v_trip_id UUID;
BEGIN
  IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'members_manage') THEN
    RAISE EXCEPTION 'AGENCY_PERMISSION_REQUIRED';
  END IF;
  IF btrim(COALESCE(p_client->>'fullName',''))='' OR jsonb_typeof(p_client)<>'object' THEN
    RAISE EXCEPTION 'INVALID_CLIENT';
  END IF;

  IF p_client_id IS NULL THEN
    INSERT INTO public.agency_clients(
      workspace_uuid,full_name,email,phone,locale,notes,created_by,updated_by
    ) VALUES (
      p_workspace_uuid,btrim(p_client->>'fullName'),NULLIF(lower(btrim(p_client->>'email')),''),
      NULLIF(btrim(p_client->>'phone'),''),COALESCE(NULLIF(p_client->>'locale',''),'nl'),
      NULLIF(btrim(p_client->>'notes'),''),p_actor_id,p_actor_id
    ) RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.agency_clients SET
      full_name=btrim(p_client->>'fullName'),email=NULLIF(lower(btrim(p_client->>'email')),''),
      phone=NULLIF(btrim(p_client->>'phone'),''),locale=COALESCE(NULLIF(p_client->>'locale',''),'nl'),
      notes=NULLIF(btrim(p_client->>'notes'),''),updated_at=now(),updated_by=p_actor_id
    WHERE id=p_client_id AND workspace_uuid=p_workspace_uuid
    RETURNING id INTO v_client_id;
    IF v_client_id IS NULL THEN RAISE EXCEPTION 'CLIENT_NOT_FOUND'; END IF;
  END IF;

  DELETE FROM public.agency_client_trips WHERE client_id=v_client_id;
  FOREACH v_trip_id IN ARRAY COALESCE(p_trip_ids,ARRAY[]::UUID[]) LOOP
    INSERT INTO public.agency_client_trips(client_id,trip_uuid,linked_by)
    VALUES(v_client_id,v_trip_id,p_actor_id) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN v_client_id;
END $$;

CREATE OR REPLACE FUNCTION public.set_agency_client_archived(
  p_actor_id UUID,p_workspace_uuid UUID,p_client_id UUID,p_archived BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'members_manage') THEN
    RAISE EXCEPTION 'AGENCY_PERMISSION_REQUIRED';
  END IF;
  UPDATE public.agency_clients SET status=CASE WHEN p_archived THEN 'archived' ELSE 'active' END,
    updated_at=now(),updated_by=p_actor_id
  WHERE id=p_client_id AND workspace_uuid=p_workspace_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'CLIENT_NOT_FOUND'; END IF;
  RETURN true;
END $$;

ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_client_trips ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_clients,public.agency_client_trips FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.agency_clients,public.agency_client_trips TO service_role;
REVOKE ALL ON FUNCTION private.validate_agency_client_trip() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_agency_client(UUID,UUID,UUID,JSONB,UUID[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.set_agency_client_archived(UUID,UUID,UUID,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_client(UUID,UUID,UUID,JSONB,UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_agency_client_archived(UUID,UUID,UUID,BOOLEAN) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
