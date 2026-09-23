BEGIN;

CREATE TABLE public.web_push_subscriptions(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 endpoint TEXT NOT NULL CHECK(endpoint~'^https://' AND char_length(endpoint)<=2048),p256dh TEXT NOT NULL CHECK(char_length(p256dh) BETWEEN 40 AND 200),
 auth_secret TEXT NOT NULL CHECK(char_length(auth_secret) BETWEEN 10 AND 100),user_agent TEXT CHECK(char_length(user_agent)<=300),
 expires_at TIMESTAMPTZ,revoked_at TIMESTAMPTZ,last_success_at TIMESTAMPTZ,last_failure_code TEXT,last_failure_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(endpoint));
CREATE INDEX web_push_subscriptions_user_idx ON public.web_push_subscriptions(user_id,updated_at DESC) WHERE revoked_at IS NULL;
CREATE TABLE public.web_push_outbox(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
 subscription_id UUID NOT NULL REFERENCES public.web_push_subscriptions(id) ON DELETE CASCADE,payload JSONB NOT NULL CHECK(jsonb_typeof(payload)='object' AND pg_column_size(payload)<=2048),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','sent','failed','cancelled')),attempts SMALLINT NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 6),
 available_at TIMESTAMPTZ NOT NULL DEFAULT now(),claimed_at TIMESTAMPTZ,sent_at TIMESTAMPTZ,last_error_code TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(notification_id,subscription_id));
CREATE INDEX web_push_outbox_worker_idx ON public.web_push_outbox(status,available_at) WHERE status IN('pending','failed');

ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;ALTER TABLE public.web_push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_push_subscriptions,public.web_push_outbox FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.web_push_subscriptions,public.web_push_outbox TO service_role;

CREATE OR REPLACE FUNCTION private.queue_web_push_notification() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.dismissed_at IS NOT NULL THEN RETURN NEW;END IF;
 INSERT INTO public.web_push_outbox(notification_id,subscription_id,payload)
 SELECT NEW.id,s.id,jsonb_build_object('title','GlobeTrotr','body','You have a new notification. / Je hebt een nieuwe melding.','url','/dashboard','tag','notification-'||NEW.id::text)
 FROM public.web_push_subscriptions s WHERE s.user_id=NEW.user_id AND s.revoked_at IS NULL AND (s.expires_at IS NULL OR s.expires_at>now())
 ON CONFLICT(notification_id,subscription_id) DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER queue_web_push_notification AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION private.queue_web_push_notification();

CREATE OR REPLACE FUNCTION public.claim_web_push_outbox(p_limit INTEGER DEFAULT 20) RETURNS SETOF public.web_push_outbox LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN QUERY WITH chosen AS(SELECT id FROM public.web_push_outbox WHERE status IN('pending','failed') AND available_at<=now() AND attempts<6 ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),100))
 UPDATE public.web_push_outbox o SET status='processing',attempts=o.attempts+1,claimed_at=now(),updated_at=now() FROM chosen WHERE o.id=chosen.id RETURNING o.*;
END $$;
CREATE OR REPLACE FUNCTION public.complete_web_push_outbox(p_id UUID,p_succeeded BOOLEAN,p_error_code TEXT DEFAULT NULL,p_gone BOOLEAN DEFAULT false) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_subscription UUID;
BEGIN
 UPDATE public.web_push_outbox SET status=CASE WHEN p_succeeded THEN 'sent' WHEN p_gone THEN 'cancelled' WHEN attempts>=6 THEN 'cancelled' ELSE 'failed' END,
 sent_at=CASE WHEN p_succeeded THEN now() ELSE sent_at END,last_error_code=CASE WHEN p_succeeded THEN NULL ELSE left(COALESCE(p_error_code,'PUSH_FAILED'),80) END,
 available_at=CASE WHEN NOT p_succeeded AND NOT p_gone THEN now()+make_interval(secs=>LEAST(3600,30*(2^LEAST(attempts,6)))) ELSE available_at END,updated_at=now()
 WHERE id=p_id AND status='processing' RETURNING subscription_id INTO v_subscription;
 IF v_subscription IS NULL THEN RETURN false;END IF;
 UPDATE public.web_push_subscriptions SET last_success_at=CASE WHEN p_succeeded THEN now() ELSE last_success_at END,
 last_failure_at=CASE WHEN p_succeeded THEN last_failure_at ELSE now() END,last_failure_code=CASE WHEN p_succeeded THEN NULL ELSE left(COALESCE(p_error_code,'PUSH_FAILED'),80) END,
 revoked_at=CASE WHEN p_gone THEN now() ELSE revoked_at END,updated_at=now() WHERE id=v_subscription;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.cleanup_web_push_data() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_count INTEGER;
BEGIN
 UPDATE public.web_push_subscriptions SET revoked_at=COALESCE(revoked_at,now()),updated_at=now() WHERE revoked_at IS NULL AND expires_at IS NOT NULL AND expires_at<=now();
 DELETE FROM public.web_push_outbox WHERE (status IN('sent','cancelled') AND updated_at<now()-interval '30 days') OR (status='failed' AND updated_at<now()-interval '90 days');GET DIAGNOSTICS v_count=ROW_COUNT;
 DELETE FROM public.web_push_subscriptions WHERE revoked_at<now()-interval '90 days';RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION private.queue_web_push_notification(),public.claim_web_push_outbox(INTEGER),public.complete_web_push_outbox(UUID,BOOLEAN,TEXT,BOOLEAN),public.cleanup_web_push_data() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_web_push_outbox(INTEGER),public.complete_web_push_outbox(UUID,BOOLEAN,TEXT,BOOLEAN),public.cleanup_web_push_data() TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)VALUES('notifications.web-push','Meldingen','Webpush per apparaat aanmelden, ontvangen, intrekken, opnieuw proberen en verlopen abonnementen opruimen','Register, receive and revoke web push per device, verify retries and clean up expired subscriptions',474)
ON CONFLICT(item_key)DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';COMMIT;
