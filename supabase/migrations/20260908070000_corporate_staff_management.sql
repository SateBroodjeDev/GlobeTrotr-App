-- Personeelsrollen en fijnmazige bedrijfsrechten voor GlobeTrotr.
-- Uitvoeren na 20260908069000_billing_operations.sql.
BEGIN;
ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS job_title TEXT CHECK(job_title IS NULL OR char_length(job_title)<=100);
ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{"users":false,"agencies":false,"finance":false,"mail":true,"operations":false,"issues":true}'::JSONB
 CHECK(jsonb_typeof(permissions)='object' AND pg_column_size(permissions)<=2048);
ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
UPDATE public.platform_admins SET permissions=CASE role WHEN 'owner' THEN '{"users":true,"agencies":true,"finance":true,"mail":true,"operations":true,"issues":true}'::JSONB WHEN 'admin' THEN '{"users":true,"agencies":true,"finance":true,"mail":true,"operations":true,"issues":true}'::JSONB ELSE permissions END;
COMMIT;
