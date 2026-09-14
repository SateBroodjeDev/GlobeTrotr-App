-- Providergestuurde abonnements- en betaaladministratie voor Corporate Admin.
-- Uitvoeren na 20260908068000_corporate_mail_workflow.sql.
BEGIN;

CREATE TABLE public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_uuid UUID NOT NULL UNIQUE REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'paddle' CHECK (provider IN ('paddle')),
  provider_customer_id TEXT NOT NULL,
  billing_email TEXT,
  country_code TEXT CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider,provider_customer_id)
);

CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.billing_customers(id) ON DELETE CASCADE,
  provider_subscription_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('pro','agency')),
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','paused','cancelled')),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  recurring_total_minor BIGINT NOT NULL CHECK (recurring_total_minor >= 0),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month','year')),
  current_period_start TIMESTAMPTZ,current_period_end TIMESTAMPTZ,
  scheduled_change TEXT CHECK (scheduled_change IS NULL OR scheduled_change IN ('pause','cancel','change_plan')),
  cancelled_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX billing_subscriptions_status_idx ON public.billing_subscriptions(status,current_period_end);

CREATE TABLE public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.billing_customers(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  provider_transaction_id TEXT NOT NULL UNIQUE,
  invoice_id UUID REFERENCES public.corporate_invoices(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('ready','billed','paid','completed','past_due','cancelled','refunded','partially_refunded')),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),tax_minor BIGINT NOT NULL CHECK (tax_minor >= 0),total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  refunded_minor BIGINT NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0 AND refunded_minor <= total_minor),
  occurred_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(total_minor=subtotal_minor+tax_minor)
);
CREATE INDEX billing_transactions_time_idx ON public.billing_transactions(occurred_at DESC);

CREATE TABLE public.billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),provider TEXT NOT NULL DEFAULT 'paddle' CHECK(provider='paddle'),provider_event_id TEXT NOT NULL,event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,received_at TIMESTAMPTZ NOT NULL DEFAULT now(),processed_at TIMESTAMPTZ,status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','processing','processed','failed','ignored')),
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 10),last_error_code TEXT,payload JSONB NOT NULL CHECK(jsonb_typeof(payload)='object' AND pg_column_size(payload)<=262144),
  UNIQUE(provider,provider_event_id)
);
CREATE INDEX billing_webhook_worker_idx ON public.billing_webhook_events(status,received_at) WHERE status IN ('received','failed');

CREATE OR REPLACE FUNCTION public.claim_billing_webhooks(p_limit INTEGER DEFAULT 25) RETURNS SETOF public.billing_webhook_events LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN RETURN QUERY UPDATE public.billing_webhook_events e SET status='processing',attempts=e.attempts+1 WHERE e.id IN(SELECT q.id FROM public.billing_webhook_events q WHERE q.status IN('received','failed') AND q.attempts<10 ORDER BY q.received_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),100)) RETURNING e.*;END $$;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_customers,public.billing_subscriptions,public.billing_transactions,public.billing_webhook_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.billing_customers,public.billing_subscriptions,public.billing_transactions,public.billing_webhook_events TO service_role;
REVOKE ALL ON FUNCTION public.claim_billing_webhooks(INTEGER) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.claim_billing_webhooks(INTEGER) TO service_role;
NOTIFY pgrst, 'reload schema';COMMIT;
