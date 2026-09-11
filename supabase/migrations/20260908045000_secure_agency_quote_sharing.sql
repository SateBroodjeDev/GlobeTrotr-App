-- Beveiligde, tijdelijke klantlinks voor deelklare Agency-offertes.
-- Uitvoeren na 20260908044000_agency_quote_management.sql.
BEGIN;

ALTER TABLE public.agency_quotes
  ADD COLUMN IF NOT EXISTS share_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

ALTER TABLE public.agency_quotes DROP CONSTRAINT IF EXISTS agency_quotes_share_token_hash_check;
ALTER TABLE public.agency_quotes ADD CONSTRAINT agency_quotes_share_token_hash_check
  CHECK (share_token_hash IS NULL OR share_token_hash ~ '^[0-9a-f]{64}$');
ALTER TABLE public.agency_quotes DROP CONSTRAINT IF EXISTS agency_quotes_share_window_check;
ALTER TABLE public.agency_quotes ADD CONSTRAINT agency_quotes_share_window_check
  CHECK (
    (share_token_hash IS NULL AND shared_at IS NULL AND share_expires_at IS NULL)
    OR (share_token_hash IS NOT NULL AND shared_at IS NOT NULL AND share_expires_at > shared_at)
  );
CREATE UNIQUE INDEX IF NOT EXISTS agency_quotes_share_token_hash_idx
  ON public.agency_quotes(share_token_hash) WHERE share_token_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prepare_agency_quote_share(
  p_workspace_uuid UUID,
  p_quote_id UUID,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ,
  p_actor_id UUID
) RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_now TIMESTAMPTZ := now();
BEGIN
  IF p_token_hash !~ '^[0-9a-f]{64}$'
    OR p_expires_at <= v_now
    OR p_expires_at > v_now + interval '31 days' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_QUOTE_SHARE';
  END IF;
  IF NOT private.agency_actor_has_permission(p_workspace_uuid, p_actor_id, 'trips_plan') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'AGENCY_PERMISSION_REQUIRED';
  END IF;
  UPDATE public.agency_quotes
  SET share_token_hash = p_token_hash, shared_at = v_now,
      share_expires_at = p_expires_at, updated_by = p_actor_id
  WHERE id = p_quote_id AND workspace_uuid = p_workspace_uuid AND status = 'ready';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'QUOTE_NOT_SHAREABLE';
  END IF;
  RETURN p_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_agency_quote_share(UUID,UUID,TEXT,TIMESTAMPTZ,UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_agency_quote_share(UUID,UUID,TEXT,TIMESTAMPTZ,UUID)
  TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
