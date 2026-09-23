BEGIN;

-- Een eenmalige herinnering in de laatste 24 uur, uitsluitend voor leden die nog
-- niet hebben gestemd. De bestaande reisvoorkeuren filteren de melding.
CREATE OR REPLACE FUNCTION public.run_trip_option_poll_reminders(p_now TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  SELECT recipients.user_id,'trip_change',
    'Reispeiling sluit binnenkort / Trip poll closes soon',
    'Je kunt nog stemmen voordat deze peiling sluit. / You can still vote before this poll closes.',
    poll.trip_uuid,'trip-option-poll:deadline:' || poll.id::TEXT
  FROM public.trip_option_polls poll
  JOIN public.trips trip ON trip.trip_uuid = poll.trip_uuid
  CROSS JOIN LATERAL (
    SELECT trip.workspace_user_id AS user_id
    UNION SELECT member.user_id FROM public.trip_members member
      WHERE member.trip_uuid = poll.trip_uuid AND member.status = 'active'
        AND member.user_id IS NOT NULL
    UNION SELECT member.user_id FROM public.workspace_members member
      WHERE member.workspace_uuid = trip.workspace_uuid AND member.status = 'active'
        AND member.user_id IS NOT NULL
        AND private.agency_actor_has_permission(trip.workspace_uuid,member.user_id,'trips_view')
  ) recipients
  WHERE poll.status = 'open' AND poll.closes_at > p_now
    AND poll.closes_at <= p_now + interval '24 hours'
    AND NOT EXISTS (SELECT 1 FROM public.trip_option_votes vote
      WHERE vote.poll_id = poll.id AND vote.user_id = recipients.user_id)
  ON CONFLICT(user_id,event_key) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.run_trip_option_poll_reminders(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_trip_option_poll_reminders(TIMESTAMPTZ) TO service_role;

-- Bestaande meldingsvoorkeuren bepalen eerst of een melding wordt gemaakt.
-- Daarna bepaalt tripUpdates of er ook een e-mail uit mag. De notificatie-ID
-- maakt de e-mail idempotent; wegklikken annuleert een nog niet verzonden mail.
CREATE OR REPLACE FUNCTION private.queue_trip_option_poll_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_email TEXT; v_locale TEXT; v_mode TEXT; v_preferences JSONB;
BEGIN
  IF NEW.event_key NOT LIKE 'trip-option-poll:%' OR NEW.kind <> 'trip_change' THEN RETURN NEW; END IF;
  IF NEW.dismissed_at IS NOT NULL THEN
    UPDATE public.email_outbox SET status='cancelled',updated_at=now()
      WHERE notification_id=NEW.id AND status IN('held','pending','failed');
    RETURN NEW;
  END IF;
  SELECT lower(u.email), CASE WHEN lower(COALESCE(profile.locale,'')) LIKE 'en%' THEN 'en' ELSE 'nl' END,
    COALESCE(profile.notification_preferences,'{}'::JSONB)
    INTO v_email,v_locale,v_preferences
    FROM auth.users u LEFT JOIN public.profiles profile ON profile.id=u.id
    WHERE u.id=NEW.user_id AND u.email_confirmed_at IS NOT NULL;
  IF v_email IS NULL OR COALESCE((v_preferences->>'tripUpdates')::BOOLEAN,true)=false THEN RETURN NEW; END IF;
  SELECT mode INTO v_mode FROM public.email_delivery_config WHERE id=true;
  INSERT INTO public.email_outbox(notification_id,user_id,recipient_email,locale,template_key,payload,status)
  VALUES(NEW.id,NEW.user_id,v_email,COALESCE(v_locale,'nl'),'trip_change',
    jsonb_build_object('title',left(NEW.title,160),'body',left(NEW.body,1000),
      'tripId',NEW.trip_uuid,
      'actionUrl','https://portal.globetrotr.nl/trips/' || NEW.trip_uuid::TEXT),
    CASE WHEN v_mode='live' THEN 'pending' ELSE 'held' END)
  ON CONFLICT(notification_id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.queue_trip_option_poll_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER queue_trip_option_poll_email
  AFTER INSERT OR UPDATE OF dismissed_at ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION private.queue_trip_option_poll_email();

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('trip.option-poll-delivery','Communicatie',
  'Reispeiling: test eenmalige deadlineherinnering alleen voor niet-stemmers, NL/EN HTML-mail, tripUpdates uit, wegklikken en herhaalde onderhoudsrun zonder dubbele mail',
  'Trip poll: test one-time deadline reminder only for non-voters, NL/EN HTML email, tripUpdates off, dismissal and repeated maintenance without duplicate email',474)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst, 'reload schema';
COMMIT;
