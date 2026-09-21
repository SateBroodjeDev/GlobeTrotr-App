BEGIN;

CREATE TABLE public.corporate_mail_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_reply_to_message_id UUID REFERENCES public.corporate_mail_messages(id) ON DELETE SET NULL,
  recipient_addresses TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(recipient_addresses) <= 25),
  cc_addresses TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(cc_addresses) <= 25),
  subject TEXT NOT NULL DEFAULT '' CHECK (char_length(subject) <= 500),
  body_text TEXT NOT NULL DEFAULT '' CHECK (char_length(body_text) <= 50000),
  body_html TEXT NOT NULL DEFAULT '' CHECK (char_length(body_html) <= 100000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX corporate_mail_drafts_owner_idx
  ON public.corporate_mail_drafts(created_by,mailbox_id,updated_at DESC);
ALTER TABLE public.corporate_mail_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corporate_mail_drafts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.corporate_mail_drafts TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-workspace','Bedrijf','Bedrijfsmail: concept automatisch bewaren, terugopenen, zoeken en mappen controleren','Company mail: verify autosaving, reopening, searching and folders',168),
('corporate.mail-translation','Communicatie','Bedrijfsmail: NL/EN-vertaalconcept maken, controleren en als veilige HTML verzenden','Company mail: create, review and send an NL/EN translation draft as safe HTML',169)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
