BEGIN;

ALTER TABLE public.agency_mail_settings
  ADD COLUMN IF NOT EXISTS smtp_host TEXT,
  ADD COLUMN IF NOT EXISTS smtp_port INTEGER NOT NULL DEFAULT 587,
  ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smtp_username TEXT,
  ADD COLUMN IF NOT EXISTS smtp_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS smtp_tested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS smtp_test_status TEXT,
  ADD COLUMN IF NOT EXISTS smtp_last_error_code TEXT;

ALTER TABLE public.agency_mail_settings DROP CONSTRAINT IF EXISTS agency_mail_settings_smtp_host_check;
ALTER TABLE public.agency_mail_settings ADD CONSTRAINT agency_mail_settings_smtp_host_check
  CHECK (smtp_host IS NULL OR (char_length(smtp_host) BETWEEN 1 AND 253 AND smtp_host ~ '^[A-Za-z0-9.-]+$'));
ALTER TABLE public.agency_mail_settings DROP CONSTRAINT IF EXISTS agency_mail_settings_smtp_port_check;
ALTER TABLE public.agency_mail_settings ADD CONSTRAINT agency_mail_settings_smtp_port_check CHECK (smtp_port BETWEEN 1 AND 65535);
ALTER TABLE public.agency_mail_settings DROP CONSTRAINT IF EXISTS agency_mail_settings_smtp_username_check;
ALTER TABLE public.agency_mail_settings ADD CONSTRAINT agency_mail_settings_smtp_username_check CHECK (smtp_username IS NULL OR char_length(smtp_username) BETWEEN 1 AND 254);
ALTER TABLE public.agency_mail_settings DROP CONSTRAINT IF EXISTS agency_mail_settings_smtp_test_status_check;
ALTER TABLE public.agency_mail_settings ADD CONSTRAINT agency_mail_settings_smtp_test_status_check CHECK (smtp_test_status IS NULL OR smtp_test_status IN ('ok','failed'));

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('agency.smtp-delivery','Agency','Eigen Agency-SMTP versleuteld opslaan, verbinding testen en een gebrande uitnodiging via die server bezorgen','Store custom Agency SMTP encrypted, test its connection and deliver a branded invitation through that server',470)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
