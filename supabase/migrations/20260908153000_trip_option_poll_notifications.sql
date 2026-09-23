BEGIN;

-- Alleen servertriggers schrijven auditregels; inhoud van reacties wordt niet gekopieerd.
CREATE TABLE public.trip_option_poll_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES public.trip_option_polls(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created','voted','changed','withdrawn','closed')),
  option_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trip_option_poll_audit_poll_idx ON public.trip_option_poll_audit(poll_id, created_at);
ALTER TABLE public.trip_option_poll_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_option_poll_audit FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.trip_option_poll_audit TO service_role;

CREATE OR REPLACE FUNCTION private.record_trip_option_poll_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_trip UUID;
  v_workspace UUID;
  v_owner UUID;
  v_actor UUID;
  v_action TEXT;
  v_poll UUID;
  v_option TEXT;
BEGIN
  IF TG_TABLE_NAME = 'trip_option_polls' THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    v_trip := NEW.trip_uuid;
    v_poll := NEW.id;
    v_actor := auth.uid();
    v_action := CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'closed' END;
    v_option := NEW.chosen_option_id;
  ELSE
    v_poll := CASE WHEN TG_OP = 'DELETE' THEN OLD.poll_id ELSE NEW.poll_id END;
    SELECT trip_uuid INTO v_trip FROM public.trip_option_polls WHERE id = v_poll;
    IF v_trip IS NULL THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;
    v_actor := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
    v_action := CASE TG_OP WHEN 'INSERT' THEN 'voted'
      WHEN 'UPDATE' THEN 'changed' ELSE 'withdrawn' END;
    v_option := CASE WHEN TG_OP = 'DELETE' THEN OLD.option_id ELSE NEW.option_id END;
  END IF;

  INSERT INTO public.trip_option_poll_audit(trip_uuid,poll_id,actor_user_id,action,option_id)
  VALUES(v_trip,v_poll,v_actor,v_action,v_option);

  IF v_action = 'closed' THEN
    UPDATE public.notifications SET dismissed_at=COALESCE(dismissed_at,now())
    WHERE trip_uuid=v_trip AND event_key IN (
      'trip-option-poll:created:' || v_poll::TEXT,
      'trip-option-poll:deadline:' || v_poll::TEXT
    ) AND dismissed_at IS NULL;
  ELSIF v_action = 'voted' THEN
    UPDATE public.notifications SET dismissed_at=COALESCE(dismissed_at,now())
    WHERE user_id=v_actor AND trip_uuid=v_trip
      AND event_key='trip-option-poll:deadline:' || v_poll::TEXT
      AND dismissed_at IS NULL;
  END IF;

  IF TG_TABLE_NAME = 'trip_option_polls' THEN
    SELECT workspace_uuid,workspace_user_id INTO v_workspace,v_owner
      FROM public.trips WHERE trip_uuid = v_trip;
    INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
    SELECT recipients.user_id, 'trip_change',
      CASE v_action WHEN 'created' THEN 'Nieuwe reispeiling / New trip poll'
        ELSE 'Reiskeuze vastgelegd / Trip choice confirmed' END,
      CASE v_action WHEN 'created' THEN 'Stem op een kandidaat in je reis. / Vote for a candidate in your trip.'
        ELSE 'Bekijk de gekozen kandidaat in je reis. / View the chosen candidate in your trip.' END,
      v_trip, 'trip-option-poll:' || v_action || ':' || v_poll::TEXT
    FROM (
      SELECT v_owner AS user_id
      UNION SELECT member.user_id FROM public.trip_members member
        WHERE member.trip_uuid = v_trip AND member.status = 'active' AND member.user_id IS NOT NULL
      UNION SELECT member.user_id FROM public.workspace_members member
        WHERE member.workspace_uuid = v_workspace AND member.status = 'active'
          AND member.user_id IS NOT NULL
          AND private.agency_actor_has_permission(v_workspace,member.user_id,'trips_view')
    ) recipients
    WHERE recipients.user_id IS NOT NULL AND recipients.user_id IS DISTINCT FROM v_actor
    ON CONFLICT(user_id,event_key) DO NOTHING;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
REVOKE ALL ON FUNCTION private.record_trip_option_poll_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trip_option_poll_events AFTER INSERT OR UPDATE OF status ON public.trip_option_polls
  FOR EACH ROW EXECUTE FUNCTION private.record_trip_option_poll_event();
CREATE TRIGGER trip_option_vote_events AFTER INSERT OR UPDATE OF option_id OR DELETE ON public.trip_option_votes
  FOR EACH ROW EXECUTE FUNCTION private.record_trip_option_poll_event();

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('trip.option-poll-notifications','Reizen',
  'Reispeiling: controleer melding bij starten en afsluiten, voorkeuren NL/EN, geen eigen melding, en audit zonder reactie-inhoud',
  'Trip poll: verify notification on creation and closure, NL/EN preferences, no self-notification, and audit without comment content',473)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst, 'reload schema';
COMMIT;
