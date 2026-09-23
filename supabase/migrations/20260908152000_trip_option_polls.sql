BEGIN;

CREATE TABLE public.trip_option_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  option_ids TEXT[] NOT NULL CHECK (cardinality(option_ids) BETWEEN 2 AND 4),
  option_labels JSONB NOT NULL DEFAULT '{}'::JSONB,
  closes_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  chosen_option_id TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  CHECK ((status = 'open' AND chosen_option_id IS NULL AND closed_at IS NULL)
    OR (status = 'closed' AND chosen_option_id IS NOT NULL AND closed_at IS NOT NULL))
);
CREATE UNIQUE INDEX trip_option_one_open_poll_idx ON public.trip_option_polls(trip_uuid)
  WHERE status = 'open';

CREATE OR REPLACE FUNCTION private.validate_trip_option_poll()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.trip_uuid IS DISTINCT FROM OLD.trip_uuid
      OR NEW.option_ids IS DISTINCT FROM OLD.option_ids
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.closes_at IS DISTINCT FROM OLD.closes_at
      OR OLD.status = 'closed' THEN
      RAISE EXCEPTION 'POLL_IMMUTABLE';
    END IF;
    IF NEW.status <> 'closed' OR NEW.chosen_option_id IS NULL
      OR NEW.closed_at IS NULL THEN RAISE EXCEPTION 'INVALID_POLL_CLOSE'; END IF;
    NEW.option_labels := OLD.option_labels;
  ELSE
    IF NEW.status <> 'open' OR NEW.chosen_option_id IS NOT NULL
      OR NEW.closed_at IS NOT NULL THEN RAISE EXCEPTION 'INVALID_POLL_CREATE'; END IF;
    SELECT count(DISTINCT choice_id) INTO v_count
      FROM unnest(NEW.option_ids) AS choices(choice_id);
    IF v_count <> cardinality(NEW.option_ids) THEN RAISE EXCEPTION 'DUPLICATE_POLL_OPTION'; END IF;
    SELECT count(*) INTO v_count FROM public.trip_travel_options o
      WHERE o.trip_uuid = NEW.trip_uuid AND o.id = ANY(NEW.option_ids)
        AND o.status = 'candidate';
    IF v_count <> cardinality(NEW.option_ids) THEN RAISE EXCEPTION 'INVALID_POLL_OPTIONS'; END IF;
    SELECT jsonb_object_agg(o.id, o.title) INTO NEW.option_labels
      FROM public.trip_travel_options o
      WHERE o.trip_uuid = NEW.trip_uuid AND o.id = ANY(NEW.option_ids);
  END IF;
  IF NEW.chosen_option_id IS NOT NULL AND NOT (NEW.chosen_option_id = ANY(NEW.option_ids))
    THEN RAISE EXCEPTION 'INVALID_POLL_CHOICE'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_trip_option_poll() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_trip_option_poll BEFORE INSERT OR UPDATE ON public.trip_option_polls
  FOR EACH ROW EXECUTE FUNCTION private.validate_trip_option_poll();

CREATE TABLE public.trip_option_votes (
  poll_id UUID NOT NULL REFERENCES public.trip_option_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id)
);

CREATE OR REPLACE FUNCTION private.check_trip_option_vote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.trip_option_polls p
    WHERE p.id = NEW.poll_id AND p.status = 'open'
      AND (p.closes_at IS NULL OR p.closes_at > now())
      AND NEW.option_id = ANY(p.option_ids)
  ) THEN RAISE EXCEPTION 'POLL_NOT_OPEN'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.check_trip_option_vote() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER check_trip_option_vote BEFORE INSERT OR UPDATE ON public.trip_option_votes
  FOR EACH ROW EXECUTE FUNCTION private.check_trip_option_vote();

ALTER TABLE public.trip_option_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_option_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_option_polls, public.trip_option_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.trip_option_polls TO authenticated;
GRANT UPDATE (status, chosen_option_id, closed_at) ON public.trip_option_polls TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.trip_option_votes TO authenticated;
GRANT UPDATE (option_id) ON public.trip_option_votes TO authenticated;
GRANT ALL ON public.trip_option_polls, public.trip_option_votes TO service_role;

CREATE POLICY "Trip members read option polls" ON public.trip_option_polls
  FOR SELECT TO authenticated USING ((SELECT private.can_view_trip(trip_uuid)));
CREATE POLICY "Planners create option polls" ON public.trip_option_polls
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()) AND (SELECT private.can_plan_trip(trip_uuid)));
CREATE POLICY "Planners close option polls" ON public.trip_option_polls
  FOR UPDATE TO authenticated
  USING ((SELECT private.can_plan_trip(trip_uuid)))
  WITH CHECK ((SELECT private.can_plan_trip(trip_uuid)));

CREATE POLICY "Trip members read option votes" ON public.trip_option_votes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trip_option_polls p
    WHERE p.id = poll_id AND private.can_view_trip(p.trip_uuid)));
CREATE POLICY "Trip members cast own vote" ON public.trip_option_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.trip_option_polls p WHERE p.id = poll_id
      AND p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())
      AND option_id = ANY(p.option_ids) AND private.can_view_trip(p.trip_uuid)));
CREATE POLICY "Trip members change own vote" ON public.trip_option_votes
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.trip_option_polls p WHERE p.id = poll_id
      AND p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())
      AND private.can_view_trip(p.trip_uuid)))
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.trip_option_polls p WHERE p.id = poll_id
      AND p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())
      AND option_id = ANY(p.option_ids) AND private.can_view_trip(p.trip_uuid)));
CREATE POLICY "Trip members withdraw own vote" ON public.trip_option_votes
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.trip_option_polls p WHERE p.id = poll_id
      AND p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())
      AND private.can_view_trip(p.trip_uuid)));

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES ('trip.option-decisions', 'Reizen',
  'Reisvergelijker: maak een peiling met deadline, laat twee reisleden stemmen en wijzigen/intrekken, controleer precies één stem per lid, verlopen peiling en alleen-planner-afsluiting met een definitieve keuze',
  'Trip comparison: create a poll with a deadline, have two trip members vote and change/withdraw, verify exactly one vote per member, expired poll and planner-only closing with a final choice',
  472)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category, label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en, position=EXCLUDED.position, updated_at=now();

NOTIFY pgrst, 'reload schema';
COMMIT;
