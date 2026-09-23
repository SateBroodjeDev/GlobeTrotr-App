BEGIN;

ALTER TABLE public.corporate_mailboxes
  DROP CONSTRAINT IF EXISTS corporate_mailboxes_mailbox_type_check;
ALTER TABLE public.corporate_mailboxes
  ADD CONSTRAINT corporate_mailboxes_mailbox_type_check
  CHECK (mailbox_type IN ('personal','shared','automated'));
ALTER TABLE public.corporate_mailboxes
  DROP CONSTRAINT IF EXISTS corporate_mailboxes_check;
ALTER TABLE public.corporate_mailboxes
  ADD CONSTRAINT corporate_mailboxes_owner_check
  CHECK ((mailbox_type='personal' AND owner_user_id IS NOT NULL) OR mailbox_type IN ('shared','automated'));

ALTER TABLE public.corporate_mailboxes
  ADD COLUMN IF NOT EXISTS hosting_mode TEXT NOT NULL DEFAULT 'external'
    CHECK (hosting_mode IN ('external','self_hosted')),
  ADD COLUMN IF NOT EXISTS provisioning_status TEXT NOT NULL DEFAULT 'external'
    CHECK (provisioning_status IN ('external','pending','provisioning','ready','error','disabled')),
  ADD COLUMN IF NOT EXISTS provisioning_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provisioning_error_code TEXT
    CHECK (provisioning_error_code IS NULL OR char_length(provisioning_error_code)<=80),
  ADD COLUMN IF NOT EXISTS mail_server_account_id TEXT
    CHECK (mail_server_account_id IS NULL OR char_length(mail_server_account_id)<=200);

CREATE INDEX IF NOT EXISTS corporate_mailboxes_provisioning_idx
  ON public.corporate_mailboxes(provisioning_status,provisioning_requested_at)
  WHERE hosting_mode='self_hosted';

CREATE OR REPLACE FUNCTION public.claim_mailbox_provisioning(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(id UUID,address TEXT,display_name TEXT,mailbox_type TEXT,active BOOLEAN,
  imap_password_ciphertext TEXT,mail_server_account_id TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT m.id FROM public.corporate_mailboxes m
    WHERE m.hosting_mode='self_hosted' AND m.provisioning_status='pending'
      AND m.provisioning_requested_at IS NOT NULL
    ORDER BY m.provisioning_requested_at
    FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),50)
  ), updated AS (
    UPDATE public.corporate_mailboxes m SET provisioning_status='provisioning',
      provisioning_error_code=NULL,updated_at=now()
    FROM claimed WHERE m.id=claimed.id
    RETURNING m.*
  )
  SELECT u.id,u.address,u.display_name,u.mailbox_type,u.active,
    u.imap_password_ciphertext,u.mail_server_account_id FROM updated u;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_mailbox_provisioning(
  p_mailbox_id UUID,p_succeeded BOOLEAN,p_account_id TEXT DEFAULT NULL,p_error_code TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  UPDATE public.corporate_mailboxes SET
    provisioning_status=CASE WHEN p_succeeded THEN CASE WHEN active THEN 'ready' ELSE 'disabled' END ELSE 'error' END,
    mail_server_account_id=CASE WHEN p_succeeded THEN COALESCE(NULLIF(p_account_id,''),mail_server_account_id) ELSE mail_server_account_id END,
    provisioning_error_code=CASE WHEN p_succeeded THEN NULL ELSE left(COALESCE(p_error_code,'MAIL_PROVISIONING_FAILED'),80) END,
    provisioned_at=CASE WHEN p_succeeded THEN now() ELSE provisioned_at END,
    updated_at=now()
  WHERE id=p_mailbox_id AND hosting_mode='self_hosted';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_mailbox_provisioning(INTEGER) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_mailbox_provisioning(UUID,BOOLEAN,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mailbox_provisioning(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_mailbox_provisioning(UUID,BOOLEAN,TEXT,TEXT) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.self-hosted-mail','Corporate Admin',
 'Zelf gehost postvak en automatisch trip-adres maken, ontvangen, verzenden, DKIM en herstel testen',
 'Test creating, receiving, sending, DKIM and recovery for a self-hosted mailbox and automated trip address',220)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst,'reload schema';
COMMIT;
