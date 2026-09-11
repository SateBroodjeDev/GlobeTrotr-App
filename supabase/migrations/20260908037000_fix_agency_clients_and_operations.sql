-- Herstel klant-reiskoppelingen en maak gekoppelde bestaande accounts zichtbaar als klant.
-- Uitvoeren na 20260908036000_agency_audit_log.sql.
BEGIN;

ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS agency_client_id UUID
  REFERENCES public.agency_clients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS trip_members_agency_client_idx
  ON public.trip_members(agency_client_id) WHERE agency_client_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.validate_agency_client_trip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.agency_clients client
    JOIN public.trips trip ON trip.trip_uuid=NEW.trip_uuid
    WHERE client.id=NEW.client_id AND client.workspace_uuid=trip.workspace_uuid
  ) THEN
    RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='CLIENT_TRIP_WORKSPACE_MISMATCH';
  END IF;
  RETURN NEW;
END $$;

-- Archiveren trekt uitsluitend de door het klantprofiel verleende toegang in.
-- Herstellen bouwt die toegang opnieuw op voor een bestaand account met
-- hetzelfde e-mailadres; handmatig toegevoegde reisleden blijven ongemoeid.
CREATE OR REPLACE FUNCTION public.set_agency_client_archived(
  p_actor_id UUID,p_workspace_uuid UUID,p_client_id UUID,p_archived BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_client public.agency_clients%ROWTYPE; v_user_id UUID;
BEGIN
  IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'members_manage') THEN RAISE EXCEPTION 'AGENCY_PERMISSION_REQUIRED'; END IF;
  UPDATE public.agency_clients SET status=CASE WHEN p_archived THEN 'archived' ELSE 'active' END,
    updated_at=now(),updated_by=p_actor_id
  WHERE id=p_client_id AND workspace_uuid=p_workspace_uuid RETURNING * INTO v_client;
  IF NOT FOUND THEN RAISE EXCEPTION 'CLIENT_NOT_FOUND'; END IF;
  DELETE FROM public.trip_members WHERE agency_client_id=p_client_id;
  IF NOT p_archived AND v_client.email IS NOT NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email)=lower(v_client.email) LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,invited_at,accepted_at,agency_client_id)
      SELECT trip.workspace_user_id,trip.id,trip.trip_uuid,'agency-client:'||p_client_id::TEXT,
        v_user_id,v_client.full_name,v_client.email,'client','active',now(),now(),p_client_id
      FROM public.agency_client_trips link JOIN public.trips trip ON trip.trip_uuid=link.trip_uuid
      WHERE link.client_id=p_client_id AND trip.workspace_uuid=p_workspace_uuid
        AND NOT EXISTS(SELECT 1 FROM public.trip_members member WHERE member.trip_uuid=trip.trip_uuid AND member.user_id=v_user_id);
    END IF;
  END IF;
  RETURN true;
END $$;

-- Maak bestaande, actieve klantkoppelingen direct bruikbaar na de migratie.
INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,invited_at,accepted_at,agency_client_id)
SELECT trip.workspace_user_id,trip.id,trip.trip_uuid,'agency-client:'||client.id::TEXT,
  auth_user.id,client.full_name,client.email,'client','active',now(),now(),client.id
FROM public.agency_clients client
JOIN public.agency_client_trips link ON link.client_id=client.id
JOIN public.trips trip ON trip.trip_uuid=link.trip_uuid
JOIN auth.users auth_user ON lower(auth_user.email)=lower(client.email)
WHERE client.status='active'
  AND NOT EXISTS(SELECT 1 FROM public.trip_members member WHERE member.trip_uuid=trip.trip_uuid AND member.user_id=auth_user.id);

CREATE OR REPLACE FUNCTION public.save_agency_client(
  p_actor_id UUID,p_workspace_uuid UUID,p_client_id UUID,p_client JSONB,
  p_trip_ids UUID[] DEFAULT ARRAY[]::UUID[]
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_client_id UUID; v_trip_id UUID; v_user_id UUID; v_owner_id UUID; v_legacy_trip_id TEXT; v_status TEXT;
BEGIN
  IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'members_manage') THEN RAISE EXCEPTION 'AGENCY_PERMISSION_REQUIRED'; END IF;
  IF jsonb_typeof(p_client)<>'object' OR btrim(COALESCE(p_client->>'fullName',''))='' THEN RAISE EXCEPTION 'INVALID_CLIENT'; END IF;
  IF p_client_id IS NULL THEN
    INSERT INTO public.agency_clients(workspace_uuid,full_name,email,phone,locale,notes,created_by,updated_by)
    VALUES(p_workspace_uuid,btrim(p_client->>'fullName'),NULLIF(lower(btrim(p_client->>'email')),''),NULLIF(btrim(p_client->>'phone'),''),COALESCE(NULLIF(p_client->>'locale',''),'nl'),NULLIF(btrim(p_client->>'notes'),''),p_actor_id,p_actor_id)
    RETURNING id,status INTO v_client_id,v_status;
  ELSE
    UPDATE public.agency_clients SET full_name=btrim(p_client->>'fullName'),email=NULLIF(lower(btrim(p_client->>'email')),''),phone=NULLIF(btrim(p_client->>'phone'),''),locale=COALESCE(NULLIF(p_client->>'locale',''),'nl'),notes=NULLIF(btrim(p_client->>'notes'),''),updated_at=now(),updated_by=p_actor_id
    WHERE id=p_client_id AND workspace_uuid=p_workspace_uuid RETURNING id,status INTO v_client_id,v_status;
    IF v_client_id IS NULL THEN RAISE EXCEPTION 'CLIENT_NOT_FOUND'; END IF;
  END IF;

  -- Alleen automatisch door dit klantprofiel gemaakte deelnames worden vervangen.
  DELETE FROM public.trip_members WHERE agency_client_id=v_client_id;
  DELETE FROM public.agency_client_trips WHERE client_id=v_client_id;
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email)=lower(NULLIF(p_client->>'email','')) LIMIT 1;
  FOREACH v_trip_id IN ARRAY COALESCE(p_trip_ids,ARRAY[]::UUID[]) LOOP
    INSERT INTO public.agency_client_trips(client_id,trip_uuid,linked_by) VALUES(v_client_id,v_trip_id,p_actor_id);
    IF v_user_id IS NOT NULL AND v_status='active' THEN
      SELECT workspace_user_id,id INTO v_owner_id,v_legacy_trip_id FROM public.trips
      WHERE trip_uuid=v_trip_id AND workspace_uuid=p_workspace_uuid;
      IF NOT EXISTS(SELECT 1 FROM public.trip_members WHERE trip_uuid=v_trip_id AND user_id=v_user_id) THEN
        INSERT INTO public.trip_members(workspace_user_id,trip_id,trip_uuid,id,user_id,name,email,role,status,invited_at,accepted_at,agency_client_id)
        VALUES(v_owner_id,v_legacy_trip_id,v_trip_id,'agency-client:'||v_client_id::TEXT,v_user_id,btrim(p_client->>'fullName'),lower(p_client->>'email'),'client','active',now(),now(),v_client_id);
      END IF;
    END IF;
  END LOOP;
  RETURN v_client_id;
END $$;

REVOKE ALL ON FUNCTION private.validate_agency_client_trip() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_agency_client(UUID,UUID,UUID,JSONB,UUID[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.set_agency_client_archived(UUID,UUID,UUID,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_client(UUID,UUID,UUID,JSONB,UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_agency_client_archived(UUID,UUID,UUID,BOOLEAN) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
