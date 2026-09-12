-- Centrale providerstops, dagquota en een veilige wachtrij voor de worker-VPS.
-- Uitvoeren na 20260908064000_email_outbox_test_mode.sql.
BEGIN;

CREATE TABLE public.platform_provider_controls (
  provider TEXT PRIMARY KEY CHECK (provider ~ '^[a-z][a-z0-9_]{1,39}$'),
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 240),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.platform_provider_controls(provider) VALUES
  ('weather'), ('flight_lookup'), ('routing'), ('email'), ('domain_verification'), ('object_storage')
ON CONFLICT(provider) DO NOTHING;

CREATE TABLE public.external_api_usage (
  usage_date DATE NOT NULL DEFAULT current_date,
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL REFERENCES public.platform_provider_controls(provider),
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(usage_date, workspace_uuid, actor_user_id, provider)
);

CREATE TABLE public.worker_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL REFERENCES public.platform_provider_controls(provider),
  job_type TEXT NOT NULL CHECK (job_type ~ '^[a-z][a-z0-9_.]{1,79}$'),
  plan TEXT NOT NULL CHECK (plan IN ('free','pro','agency')),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB
    CHECK (jsonb_typeof(payload) = 'object' AND pg_column_size(payload) <= 16384),
  idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error_code TEXT CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, idempotency_key)
);

CREATE INDEX worker_jobs_claim_idx ON public.worker_jobs(available_at, created_at)
  WHERE status IN ('pending','failed');
CREATE INDEX external_api_usage_workspace_idx
  ON public.external_api_usage(workspace_uuid, usage_date DESC);

CREATE OR REPLACE FUNCTION public.consume_external_api_quota(
  p_workspace_uuid UUID, p_actor_user_id UUID, p_provider TEXT, p_daily_limit INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_enabled BOOLEAN; v_calls INTEGER;
BEGIN
  IF p_daily_limit < 1 OR p_daily_limit > 100000 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='INVALID_PROVIDER_LIMIT';
  END IF;
  SELECT enabled INTO v_enabled FROM public.platform_provider_controls WHERE provider=p_provider;
  IF v_enabled IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='UNKNOWN_PROVIDER'; END IF;
  IF NOT v_enabled THEN RETURN jsonb_build_object('allowed',false,'reason','provider_disabled','used',0,'limit',p_daily_limit); END IF;
  INSERT INTO public.external_api_usage(usage_date,workspace_uuid,actor_user_id,provider,calls)
  VALUES(current_date,p_workspace_uuid,p_actor_user_id,p_provider,1)
  ON CONFLICT(usage_date,workspace_uuid,actor_user_id,provider) DO UPDATE
    SET calls=public.external_api_usage.calls+1,updated_at=now()
    WHERE public.external_api_usage.calls < p_daily_limit
  RETURNING calls INTO v_calls;
  IF v_calls IS NULL THEN
    SELECT calls INTO v_calls FROM public.external_api_usage
    WHERE usage_date=current_date AND workspace_uuid=p_workspace_uuid AND actor_user_id=p_actor_user_id AND provider=p_provider;
    RETURN jsonb_build_object('allowed',false,'reason','quota_exceeded','used',v_calls,'limit',p_daily_limit);
  END IF;
  RETURN jsonb_build_object('allowed',true,'used',v_calls,'remaining',p_daily_limit-v_calls,'limit',p_daily_limit);
END $$;

CREATE OR REPLACE FUNCTION public.enqueue_worker_job(
  p_workspace_uuid UUID, p_actor_user_id UUID, p_provider TEXT, p_job_type TEXT,
  p_plan TEXT, p_payload JSONB, p_idempotency_key TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id UUID; v_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO v_enabled FROM public.platform_provider_controls WHERE provider=p_provider;
  IF v_enabled IS DISTINCT FROM true THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='PROVIDER_UNAVAILABLE'; END IF;
  INSERT INTO public.worker_jobs(workspace_uuid,actor_user_id,provider,job_type,plan,payload,idempotency_key)
  VALUES(p_workspace_uuid,p_actor_user_id,p_provider,p_job_type,p_plan,COALESCE(p_payload,'{}'::JSONB),p_idempotency_key)
  ON CONFLICT(provider,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.claim_worker_jobs(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.worker_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY UPDATE public.worker_jobs job
  SET status='processing',attempts=attempts+1,claimed_at=now(),updated_at=now()
  WHERE job.id IN (
    SELECT candidate.id FROM public.worker_jobs candidate
    JOIN public.platform_provider_controls control ON control.provider=candidate.provider AND control.enabled
    WHERE candidate.status IN ('pending','failed') AND candidate.available_at<=now() AND candidate.attempts<10
    ORDER BY candidate.available_at,candidate.created_at FOR UPDATE OF candidate SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit,1),100)
  ) RETURNING job.*;
END $$;

CREATE OR REPLACE FUNCTION public.complete_worker_job(
  p_job_id UUID, p_succeeded BOOLEAN, p_error_code TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.worker_jobs SET
    status=CASE WHEN p_succeeded THEN 'completed' WHEN attempts>=10 THEN 'cancelled' ELSE 'failed' END,
    completed_at=CASE WHEN p_succeeded THEN now() ELSE NULL END,
    available_at=CASE WHEN p_succeeded THEN available_at ELSE now()+make_interval(secs=>LEAST(3600,30*power(2,GREATEST(attempts-1,0))::INTEGER)) END,
    last_error_code=CASE WHEN p_succeeded THEN NULL ELSE left(COALESCE(p_error_code,'WORKER_FAILED'),80) END,
    updated_at=now()
  WHERE id=p_job_id AND status='processing';
  RETURN FOUND;
END $$;

ALTER TABLE public.platform_provider_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_provider_controls,public.external_api_usage,public.worker_jobs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_provider_controls,public.external_api_usage,public.worker_jobs TO service_role;
REVOKE ALL ON FUNCTION public.consume_external_api_quota(UUID,UUID,TEXT,INTEGER),public.enqueue_worker_job(UUID,UUID,TEXT,TEXT,TEXT,JSONB,TEXT),public.claim_worker_jobs(INTEGER),public.complete_worker_job(UUID,BOOLEAN,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_external_api_quota(UUID,UUID,TEXT,INTEGER),public.enqueue_worker_job(UUID,UUID,TEXT,TEXT,TEXT,JSONB,TEXT),public.claim_worker_jobs(INTEGER),public.complete_worker_job(UUID,BOOLEAN,TEXT) TO service_role;
COMMIT;
