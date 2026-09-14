-- Uitvoeren na 20260908065000_provider_quotas_and_worker_queue.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE pqw AS SELECT gen_random_uuid() user_id,gen_random_uuid() workspace_uuid;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT user_id,'quota-worker@example.invalid',now() FROM pqw;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT user_id,workspace_uuid,'pro','{}'::JSONB FROM pqw;
DO $$ DECLARE v_workspace UUID;v_user UUID;v_first JSONB;v_second JSONB;v_third JSONB;v_job UUID;v_same UUID;v_claim public.worker_jobs%ROWTYPE;BEGIN
 SELECT workspace_uuid,user_id INTO v_workspace,v_user FROM pqw;
 SELECT public.consume_external_api_quota(v_workspace,v_user,'weather',2) INTO v_first;
 SELECT public.consume_external_api_quota(v_workspace,v_user,'weather',2) INTO v_second;
 SELECT public.consume_external_api_quota(v_workspace,v_user,'weather',2) INTO v_third;
 IF (v_first->>'allowed')::BOOLEAN IS NOT true OR (v_second->>'remaining')::INTEGER<>0 OR (v_third->>'reason')<>'quota_exceeded' THEN RAISE EXCEPTION 'Dagquota wordt niet atomair toegepast';END IF;
 SELECT public.enqueue_worker_job(v_workspace,v_user,'email','email.notification','pro','{"notificationId":"test"}'::JSONB,'notification:quota-worker-test') INTO v_job;
 SELECT public.enqueue_worker_job(v_workspace,v_user,'email','email.notification','pro','{"notificationId":"test"}'::JSONB,'notification:quota-worker-test') INTO v_same;
 IF v_job<>v_same OR (SELECT count(*) FROM public.worker_jobs WHERE id=v_job)<>1 THEN RAISE EXCEPTION 'Idempotente job werd dubbel opgeslagen';END IF;
 SELECT * INTO v_claim FROM public.claim_worker_jobs(1);
 IF v_claim.id<>v_job OR v_claim.status<>'processing' OR v_claim.attempts<>1 THEN RAISE EXCEPTION 'Worker kon job niet exclusief claimen';END IF;
 IF NOT public.complete_worker_job(v_job,false,'TEMPORARY_PROVIDER_ERROR') THEN RAISE EXCEPTION 'Workerresultaat werd niet opgeslagen';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.worker_jobs WHERE id=v_job AND status='failed' AND available_at>now()) THEN RAISE EXCEPTION 'Retry met wachttijd ontbreekt';END IF;
 IF has_function_privilege('authenticated','public.claim_worker_jobs(integer)','EXECUTE') OR has_table_privilege('authenticated','public.worker_jobs','SELECT') THEN RAISE EXCEPTION 'Browser heeft toegang tot workerwachtrij';END IF;
END $$;
ROLLBACK;
