BEGIN;

ALTER TABLE public.email_outbox
  ADD COLUMN IF NOT EXISTS invitation_action_url TEXT
  GENERATED ALWAYS AS (payload->>'actionUrl') STORED;

DELETE FROM public.email_outbox newer
USING public.email_outbox older
WHERE newer.invitation_id IS NOT NULL
  AND newer.invitation_type = older.invitation_type
  AND newer.invitation_id = older.invitation_id
  AND newer.invitation_action_url = older.invitation_action_url
  AND (newer.created_at, newer.id) > (older.created_at, older.id);

CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_invitation_delivery_once_idx
ON public.email_outbox(invitation_type,invitation_id,invitation_action_url);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('notifications.realtime','Communicatie','Nieuwe privacy-, contact- en mailboxmeldingen direct rechtsboven controleren','Verify new privacy, contact and mailbox notifications immediately in the top-right panel',183),
('mail.invitation-once','Communicatie','Reis- en Agency-uitnodiging precies eenmaal per geldige link bezorgen','Deliver each trip and Agency invitation exactly once per valid link',184),
('account.mfa-recovery','Account','2FA-supportroute en gecontroleerde Corporate Admin-reset testen','Test the 2FA support route and controlled Corporate Admin reset',185),
('account.identity-linking','Account','Google en Discord handmatig koppelen en veilig ontkoppelen','Manually link Google and Discord and safely unlink them',186),
('trip.export-actions','Reizen','CSV, reisgids, agenda en GPX vanuit de vaste exportbalk downloaden','Download CSV, trip guide, calendar and GPX from the fixed export bar',187)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
