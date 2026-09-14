-- Voer uit na de bestaande migraties, inclusief atomic_trip_snapshots.
-- Meldingen blijven bewaard tot de ontvanger ze expliciet wegklikt.
BEGIN;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('account', 'trip_change', 'invitation')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE SET NULL,
  event_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  UNIQUE (user_id, event_key)
);
CREATE INDEX notifications_open_idx ON public.notifications(user_id, created_at DESC, id DESC)
  WHERE dismissed_at IS NULL;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (dismissed_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY "Recipients read notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Recipients dismiss notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND dismissed_at IS NOT NULL);

CREATE OR REPLACE FUNCTION private.notify_account_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (NEW.display_name, NEW.phone, NEW.avatar_path, NEW.email)
    IS DISTINCT FROM (OLD.display_name, OLD.phone, OLD.avatar_path, OLD.email) THEN
    INSERT INTO public.notifications(user_id, kind, title, body, event_key)
    VALUES (NEW.id, 'account', 'Account bijgewerkt', 'Je profielgegevens zijn gewijzigd.',
      'profile:' || txid_current()::TEXT || ':' || NEW.id::TEXT)
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_notify_change AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.notify_account_change();

CREATE OR REPLACE FUNCTION private.notify_plan_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    INSERT INTO public.notifications(user_id, kind, title, body, event_key)
    VALUES (NEW.user_id, 'account', 'Abonnement gewijzigd', 'Je huidige plan is ' || NEW.plan || '.',
      'plan:' || txid_current()::TEXT || ':' || NEW.user_id::TEXT)
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER workspaces_notify_plan AFTER UPDATE OF plan ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION private.notify_plan_change();

-- Eén melding per reis, ontvanger en transactie, ook wanneer de snapshot-writer
-- tientallen kindrijen vervangt. Uitgesteld tot de definitieve ledenlijst bestaat.
-- De huidige service-role schrijfroute verifieert altijd de workspace-eigenaar.
-- Een toekomstige service-role samenwerkingsroute moet een geverifieerde actor
-- doorgeven; de eigenaar-fallback mag daarvoor niet worden hergebruikt.
CREATE OR REPLACE FUNCTION private.notify_trip_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_trip UUID;
  v_owner UUID;
  v_actor UUID;
  v_name TEXT;
  v_actor_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
      RETURN NULL;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN v_trip := OLD.trip_uuid;
  ELSE v_trip := NEW.trip_uuid;
  END IF;
  SELECT workspace_user_id, name INTO v_owner, v_name FROM public.trips WHERE trip_uuid = v_trip;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_actor := COALESCE(auth.uid(), v_owner);
  SELECT COALESCE(NULLIF(display_name, ''), 'Een reisgenoot') INTO v_actor_name
    FROM public.profiles WHERE id = v_actor;
  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  SELECT DISTINCT m.user_id, 'trip_change', 'Reis bijgewerkt',
    COALESCE(v_actor_name, 'Een reisgenoot') || ' heeft ' || v_name || ' gewijzigd.', v_trip,
    'trip:' || txid_current()::TEXT || ':' || v_trip::TEXT
  FROM public.trip_members m
  WHERE m.trip_uuid = v_trip AND m.status = 'active' AND m.user_id IS NOT NULL AND m.user_id <> v_actor
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER trips_notify_change AFTER UPDATE ON public.trips
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.notify_trip_change();
DO $$
DECLARE v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['trip_stops', 'trip_itinerary_items', 'trip_expenses',
    'trip_travel_items', 'trip_packing_items', 'trip_documents'] LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER notify_trip_change AFTER INSERT OR UPDATE OR DELETE ON public.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.notify_trip_change()', v_table);
  END LOOP;
END;
$$;

-- Alleen geverifieerde account-e-mails ontvangen uitnodigingsmeldingen.
-- Geen token of toegang tot de reis in de melding. Acceptatie volgt via de
-- afzonderlijk te bouwen uitnodigingsstroom.
CREATE OR REPLACE FUNCTION private.notify_trip_invitation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
  SELECT u.id, 'invitation', 'Reisuitnodiging', 'Je bent uitgenodigd voor ' || t.name || '.',
    NEW.trip_uuid, 'invitation:' || NEW.id::TEXT
  FROM auth.users u JOIN public.trips t ON t.trip_uuid = NEW.trip_uuid
  WHERE lower(u.email) = lower(NEW.email) AND u.email_confirmed_at IS NOT NULL
    AND NEW.accepted_at IS NULL AND NEW.revoked_at IS NULL AND NEW.expires_at > now()
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER invitations_notify AFTER INSERT ON public.trip_invitations
  FOR EACH ROW EXECUTE FUNCTION private.notify_trip_invitation();

CREATE OR REPLACE FUNCTION private.notify_pending_invitations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, kind, title, body, trip_uuid, event_key)
    SELECT NEW.id, 'invitation', 'Reisuitnodiging', 'Je bent uitgenodigd voor ' || t.name || '.',
      i.trip_uuid, 'invitation:' || i.id::TEXT
    FROM public.trip_invitations i JOIN public.trips t ON t.trip_uuid = i.trip_uuid
    WHERE lower(i.email) = lower(NEW.email) AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL AND i.expires_at > now()
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER users_notify_pending_invitations AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.notify_pending_invitations();

REVOKE ALL ON FUNCTION private.notify_account_change(), private.notify_plan_change(),
  private.notify_trip_change(), private.notify_trip_invitation(), private.notify_pending_invitations()
  FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
