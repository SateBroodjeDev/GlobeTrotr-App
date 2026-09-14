BEGIN;

CREATE TABLE public.feedback_replies(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.beta_feedback(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK(char_length(body) BETWEEN 2 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX feedback_replies_feedback_idx ON public.feedback_replies(feedback_id,created_at);
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_replies FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.feedback_replies TO service_role;

CREATE OR REPLACE FUNCTION private.notify_corporate_feedback()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.notifications(user_id,kind,title,body,event_key)
  SELECT admin.user_id,'platform','Nieuwe feedback / New feedback',
    NEW.category||'|'||NEW.title,'admin-feedback:'||NEW.id::TEXT
  FROM public.platform_admins admin WHERE admin.active=true
  ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS beta_feedback_notify_corporate ON public.beta_feedback;
CREATE TRIGGER beta_feedback_notify_corporate AFTER INSERT ON public.beta_feedback
FOR EACH ROW EXECUTE FUNCTION private.notify_corporate_feedback();

CREATE OR REPLACE FUNCTION private.notify_urgent_known_issue()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.severity IN('high','critical') AND NEW.status<>'resolved' AND NEW.archived_at IS NULL THEN
    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    SELECT admin.user_id,'platform','Urgent bekend probleem / Urgent known issue',
      NEW.severity||'|'||NEW.title_nl,'admin-issue:'||NEW.id::TEXT
    FROM public.platform_admins admin WHERE admin.active=true
    ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  ELSE
    UPDATE public.notifications SET dismissed_at=now()
    WHERE event_key='admin-issue:'||NEW.id::TEXT AND dismissed_at IS NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS known_issues_notify_corporate ON public.known_issues;
CREATE TRIGGER known_issues_notify_corporate AFTER INSERT OR UPDATE OF severity,status,archived_at ON public.known_issues
FOR EACH ROW EXECUTE FUNCTION private.notify_urgent_known_issue();

CREATE OR REPLACE FUNCTION private.notify_feedback_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_feedback public.beta_feedback%ROWTYPE;
BEGIN
  SELECT * INTO v_feedback FROM public.beta_feedback WHERE id=NEW.feedback_id;
  IF v_feedback.user_id IS NOT NULL AND v_feedback.user_id IS DISTINCT FROM NEW.author_user_id THEN
    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    VALUES(v_feedback.user_id,'feedback','Reactie op feedback / Feedback reply','reply|'||v_feedback.title,
      'feedback-reply:'||NEW.feedback_id::TEXT)
    ON CONFLICT(user_id,event_key) DO UPDATE SET body=EXCLUDED.body,created_at=now(),dismissed_at=NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_reply_notify AFTER INSERT ON public.feedback_replies
FOR EACH ROW EXECUTE FUNCTION private.notify_feedback_reply();

REVOKE ALL ON FUNCTION private.notify_corporate_feedback(),private.notify_urgent_known_issue(),private.notify_feedback_reply() FROM PUBLIC,anon,authenticated;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.feedback-conversations','Corporate Admin','Nieuwe feedbackmelding, antwoordthread en gebruikersmelding controleren','Verify new feedback alert, reply thread and user notification',735),
('corporate.urgent-issues','Corporate Admin','Hoge en kritieke bekende problemen melden en melding bij oplossing sluiten','Alert on high and critical known issues and close the alert when resolved',736),
('corporate.public-trip-moderation','Corporate Admin','Openbare reis met reden depubliceren, archiveren en herstellen; eigenaar en auditlog controleren','Unpublish, archive and restore a public trip with a reason; verify owner notification and audit log',737),
('corporate.notification-delivery','Corporate Admin','Bezorgoverzicht van open en afgesloten in-appmeldingen per gebeurtenistype controleren','Verify delivery overview of open and dismissed in-app notifications by event type',738),
('public.metadata','Publiek','Canonical-URL, social preview en structured data op de belangrijkste publieke routes controleren','Verify canonical URL, social preview and structured data on the main public routes',109)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
