BEGIN;

CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit INTEGER DEFAULT 25)
RETURNS SETOF public.email_outbox LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (SELECT mode FROM public.email_delivery_config WHERE id=true)<>'live' THEN RETURN; END IF;
 UPDATE public.email_outbox SET status='failed',last_error_code='WORKER_LEASE_EXPIRED',available_at=now(),updated_at=now()
 WHERE status='processing' AND claimed_at<now()-interval '10 minutes' AND attempts<10;
 UPDATE public.email_outbox SET status='cancelled',last_error_code='MAX_ATTEMPTS_REACHED',updated_at=now()
 WHERE status IN('failed','processing') AND attempts>=10;
 RETURN QUERY UPDATE public.email_outbox o SET status='processing',claimed_at=now(),attempts=attempts+1,updated_at=now()
 WHERE o.id IN(SELECT q.id FROM public.email_outbox q WHERE q.status IN('pending','failed') AND q.available_at<=now() AND q.attempts<10 ORDER BY q.available_at,q.created_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),100)) RETURNING o.*;
END $$;

CREATE OR REPLACE FUNCTION public.claim_corporate_mail_queue(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.corporate_mail_send_queue LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.corporate_mail_send_queue SET status='failed',last_error_code='WORKER_LEASE_EXPIRED',available_at=now(),updated_at=now()
 WHERE status='processing' AND claimed_at<now()-interval '10 minutes' AND attempts<10;
 UPDATE public.corporate_mail_send_queue SET status='cancelled',last_error_code='MAX_ATTEMPTS_REACHED',updated_at=now()
 WHERE status IN('failed','processing') AND attempts>=10;
 RETURN QUERY UPDATE public.corporate_mail_send_queue q SET status='processing',claimed_at=now(),attempts=q.attempts+1,updated_at=now()
 WHERE q.id IN(SELECT item.id FROM public.corporate_mail_send_queue item WHERE item.status IN('pending','failed') AND item.available_at<=now() AND item.attempts<10 ORDER BY item.available_at,item.created_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),50)) RETURNING q.*;
END $$;

CREATE OR REPLACE FUNCTION public.claim_worker_jobs(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.worker_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.worker_jobs SET status='failed',last_error_code='WORKER_LEASE_EXPIRED',available_at=now(),updated_at=now()
 WHERE status='processing' AND claimed_at<now()-interval '10 minutes' AND attempts<10;
 UPDATE public.worker_jobs SET status='cancelled',last_error_code='MAX_ATTEMPTS_REACHED',updated_at=now()
 WHERE status IN('failed','processing') AND attempts>=10;
 RETURN QUERY UPDATE public.worker_jobs job SET status='processing',attempts=attempts+1,claimed_at=now(),updated_at=now()
 WHERE job.id IN(SELECT candidate.id FROM public.worker_jobs candidate JOIN public.platform_provider_controls control ON control.provider=candidate.provider AND control.enabled WHERE candidate.status IN('pending','failed') AND candidate.available_at<=now() AND candidate.attempts<10 ORDER BY candidate.available_at,candidate.created_at FOR UPDATE OF candidate SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),100)) RETURNING job.*;
END $$;

REVOKE ALL ON FUNCTION public.claim_email_outbox(INTEGER),public.claim_corporate_mail_queue(INTEGER),public.claim_worker_jobs(INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(INTEGER),public.claim_corporate_mail_queue(INTEGER),public.claim_worker_jobs(INTEGER) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('worker.claim-recovery','Infrastructuur','Herstel van verlopen workerclaims en duidelijke SMTP-foutcodes controleren','Verify stale worker claim recovery and clear SMTP error codes',145)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
