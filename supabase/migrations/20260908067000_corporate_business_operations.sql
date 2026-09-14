-- Interne bedrijfsvoering: mailboxen, mailrechten en verkoopfacturen.
-- Uitvoeren na 20260908066000_platform_operations_and_release_checklist.sql.
BEGIN;

CREATE TABLE public.corporate_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE CHECK (address = lower(address) AND address ~ '^[a-z0-9][a-z0-9._-]*@globetrotr[.]nl$'),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 100),
  mailbox_type TEXT NOT NULL CHECK (mailbox_type IN ('personal','shared')),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signature_text TEXT CHECK (signature_text IS NULL OR char_length(signature_text) <= 2000),
  inbound_secret_ref TEXT CHECK (inbound_secret_ref IS NULL OR char_length(inbound_secret_ref) <= 200),
  outbound_secret_ref TEXT CHECK (outbound_secret_ref IS NULL OR char_length(outbound_secret_ref) <= 200),
  sync_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (sync_status IN ('not_configured','ready','syncing','error','disabled')),
  last_synced_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((mailbox_type = 'personal' AND owner_user_id IS NOT NULL) OR mailbox_type = 'shared')
);

CREATE TABLE public.corporate_mailbox_members (
  mailbox_id UUID NOT NULL REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read','reply','manage')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mailbox_id,user_id)
);

CREATE TABLE public.corporate_mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
  provider_message_id TEXT NOT NULL,
  thread_key TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender_address TEXT NOT NULL,
  recipient_addresses TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '' CHECK (char_length(subject) <= 500),
  preview_text TEXT NOT NULL DEFAULT '' CHECK (char_length(preview_text) <= 1000),
  body_storage_key TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mailbox_id,provider_message_id)
);
CREATE INDEX corporate_mail_messages_inbox_idx ON public.corporate_mail_messages(mailbox_id,received_at DESC) WHERE archived_at IS NULL;

CREATE TABLE public.corporate_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_provider TEXT NOT NULL DEFAULT 'paddle' CHECK (external_provider IN ('paddle','manual')),
  external_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  workspace_uuid UUID REFERENCES public.workspaces(workspace_uuid) ON DELETE SET NULL,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 200),
  customer_email TEXT,
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor BIGINT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  status TEXT NOT NULL CHECK (status IN ('draft','open','paid','void','refunded','past_due')),
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  hosted_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (external_provider,external_id),
  CHECK (total_minor = subtotal_minor + tax_minor)
);
CREATE INDEX corporate_invoices_status_idx ON public.corporate_invoices(status,issued_at DESC);

INSERT INTO public.corporate_mailboxes(address,display_name,mailbox_type)
VALUES ('info@globetrotr.nl','GlobeTrotr Info','shared'),('privacy@globetrotr.nl','GlobeTrotr Privacy','shared')
ON CONFLICT(address) DO NOTHING;

ALTER TABLE public.corporate_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_mailbox_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_mail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corporate_mailboxes,public.corporate_mailbox_members,public.corporate_mail_messages,public.corporate_invoices FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.corporate_mailboxes,public.corporate_mailbox_members,public.corporate_mail_messages,public.corporate_invoices TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
