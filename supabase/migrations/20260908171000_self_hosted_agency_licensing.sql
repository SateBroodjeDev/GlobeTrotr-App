BEGIN;

INSERT INTO public.platform_feature_flags(flag_key,label_nl,label_en,enabled,audience)
VALUES ('self_hosted.sales','Self-Hosted Agency-verkoop','Self-Hosted Agency sales',false,'internal')
ON CONFLICT(flag_key) DO NOTHING;

CREATE TABLE public.self_hosted_customers(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 legal_name TEXT NOT NULL CHECK(char_length(legal_name) BETWEEN 2 AND 160),support_email TEXT NOT NULL CHECK(char_length(support_email)<=254),
 country_code TEXT CHECK(country_code IS NULL OR country_code~'^[A-Z]{2}$'),paddle_customer_id TEXT UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(owner_user_id));
CREATE TABLE public.self_hosted_licenses(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),customer_id UUID NOT NULL REFERENCES public.self_hosted_customers(id) ON DELETE RESTRICT,
 license_number TEXT NOT NULL UNIQUE CHECK(license_number~'^GTSH-[A-Z0-9]{8,20}$'),product TEXT NOT NULL DEFAULT 'agency' CHECK(product='agency'),
 license_type TEXT NOT NULL CHECK(license_type IN('annual','perpetual')),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','active','past_due','suspended','revoked','refunded','expired')),
 major_version SMALLINT NOT NULL DEFAULT 1 CHECK(major_version BETWEEN 1 AND 100),installation_limit SMALLINT NOT NULL DEFAULT 1 CHECK(installation_limit BETWEEN 1 AND 20),
 test_installation_limit SMALLINT NOT NULL DEFAULT 1 CHECK(test_installation_limit BETWEEN 0 AND 10),entitlements JSONB NOT NULL DEFAULT '{"agency":true,"officialUpdates":true,"support":"standard"}'::JSONB CHECK(jsonb_typeof(entitlements)='object' AND pg_column_size(entitlements)<=4096),
 starts_at TIMESTAMPTZ,expires_at TIMESTAMPTZ,maintenance_ends_at TIMESTAMPTZ,grace_days SMALLINT NOT NULL DEFAULT 14 CHECK(grace_days BETWEEN 1 AND 60),
 paddle_subscription_id TEXT UNIQUE,provider_transaction_id TEXT UNIQUE,created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(license_type='perpetual' OR expires_at IS NOT NULL));
CREATE TABLE public.self_hosted_license_secrets(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),license_id UUID NOT NULL REFERENCES public.self_hosted_licenses(id) ON DELETE CASCADE,
 key_prefix TEXT NOT NULL CHECK(key_prefix~'^gt_sh_[A-Za-z0-9_-]{6,16}$'),key_hash TEXT NOT NULL UNIQUE CHECK(key_hash~'^[0-9a-f]{64}$'),
 created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),last_used_at TIMESTAMPTZ,revoked_at TIMESTAMPTZ);
CREATE UNIQUE INDEX self_hosted_one_active_key_idx ON public.self_hosted_license_secrets(license_id) WHERE revoked_at IS NULL;
CREATE TABLE public.self_hosted_installations(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),license_id UUID NOT NULL REFERENCES public.self_hosted_licenses(id) ON DELETE CASCADE,
 installation_key TEXT NOT NULL UNIQUE CHECK(installation_key~'^inst_[A-Za-z0-9_-]{20,80}$'),environment TEXT NOT NULL CHECK(environment IN('production','test')),
 domain TEXT NOT NULL CHECK(domain=lower(domain) AND domain~'^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$'),version TEXT NOT NULL CHECK(char_length(version) BETWEEN 1 AND 40),
 secret_hash TEXT NOT NULL CHECK(secret_hash~'^[0-9a-f]{64}$'),activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 lease_expires_at TIMESTAMPTZ,revoked_at TIMESTAMPTZ,updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX self_hosted_active_domain_idx ON public.self_hosted_installations(domain) WHERE revoked_at IS NULL;
CREATE TABLE public.self_hosted_license_events(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),license_id UUID REFERENCES public.self_hosted_licenses(id) ON DELETE SET NULL,
 installation_id UUID REFERENCES public.self_hosted_installations(id) ON DELETE SET NULL,event_type TEXT NOT NULL CHECK(char_length(event_type) BETWEEN 3 AND 80),
 idempotency_key TEXT UNIQUE,context JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(jsonb_typeof(context)='object' AND pg_column_size(context)<=4096),created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.self_hosted_audit_log(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,license_id UUID REFERENCES public.self_hosted_licenses(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK(char_length(action) BETWEEN 3 AND 100),reason TEXT CHECK(reason IS NULL OR char_length(reason) BETWEEN 5 AND 500),context JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(jsonb_typeof(context)='object' AND pg_column_size(context)<=4096),created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE INDEX self_hosted_licenses_customer_idx ON public.self_hosted_licenses(customer_id,created_at DESC);
CREATE INDEX self_hosted_installations_license_idx ON public.self_hosted_installations(license_id,last_seen_at DESC);
CREATE INDEX self_hosted_events_license_idx ON public.self_hosted_license_events(license_id,created_at DESC);

ALTER TABLE public.self_hosted_customers ENABLE ROW LEVEL SECURITY;ALTER TABLE public.self_hosted_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_hosted_license_secrets ENABLE ROW LEVEL SECURITY;ALTER TABLE public.self_hosted_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_hosted_license_events ENABLE ROW LEVEL SECURITY;ALTER TABLE public.self_hosted_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.self_hosted_customers,public.self_hosted_licenses,public.self_hosted_license_secrets,public.self_hosted_installations,public.self_hosted_license_events,public.self_hosted_audit_log FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.self_hosted_customers,public.self_hosted_licenses,public.self_hosted_license_secrets,public.self_hosted_installations,public.self_hosted_license_events,public.self_hosted_audit_log TO service_role;

CREATE OR REPLACE FUNCTION private.validate_self_hosted_license() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 NEW.updated_at:=now();
 IF NEW.license_type='annual' AND NEW.expires_at IS NULL THEN RAISE EXCEPTION 'ANNUAL_LICENSE_EXPIRY_REQUIRED';END IF;
 IF NEW.license_type='perpetual' THEN NEW.expires_at:=NULL;END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_self_hosted_license() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_self_hosted_license BEFORE INSERT OR UPDATE ON public.self_hosted_licenses FOR EACH ROW EXECUTE FUNCTION private.validate_self_hosted_license();

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('self-hosted.licensing','Self-Hosted','Self-Hosted blijft verborgen; controleer sleuteluitgifte, activatielimiet, lease, intrekken, audit, grace-periode en klantdata-toegang','Keep Self-Hosted hidden; verify key issuance, activation limits, leases, revocation, audit, grace period and customer data access',238)
ON CONFLICT(item_key)DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';COMMIT;
