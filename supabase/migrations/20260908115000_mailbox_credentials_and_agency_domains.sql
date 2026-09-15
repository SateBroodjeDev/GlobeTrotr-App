BEGIN;

ALTER TABLE public.corporate_mailboxes
  ADD COLUMN IF NOT EXISTS imap_host TEXT,
  ADD COLUMN IF NOT EXISTS imap_port INTEGER NOT NULL DEFAULT 993 CHECK(imap_port BETWEEN 1 AND 65535),
  ADD COLUMN IF NOT EXISTS imap_secure BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS imap_username TEXT,
  ADD COLUMN IF NOT EXISTS imap_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS credentials_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS agency_domains_verified_custom_domain_idx
  ON public.agency_domains(custom_domain)
  WHERE verification_status='verified' AND custom_domain IS NOT NULL;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mailbox-credentials','Corporate Admin','Postvakspecifieke IMAP-koppeling versleuteld opslaan en synchroniseren','Store and synchronise encrypted mailbox-specific IMAP credentials',188),
('corporate.mail-html','Corporate Admin','HTML-mail, huisstijl en mailboxhandtekening in gangbare mailclients controleren','Verify HTML email, branding and mailbox signature in common email clients',189),
('agency.domain-onboarding','Agency','CNAME/TXT-verificatie en begrensde TLS-uitgifte voor een eigen domein controleren','Verify CNAME/TXT onboarding and restricted TLS issuance for a custom domain',190)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
