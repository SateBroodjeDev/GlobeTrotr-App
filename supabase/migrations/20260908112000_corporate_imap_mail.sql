BEGIN;
ALTER TABLE public.corporate_mail_messages ADD COLUMN IF NOT EXISTS body_text TEXT CHECK(body_text IS NULL OR char_length(body_text)<=100000);
UPDATE public.corporate_mailboxes SET signature_text=display_name||E'\nGlobeTrotr\nPlan every trip. Track every euro.\nhttps://globetrotr.nl' WHERE signature_text IS NULL;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-imap','Corporate Admin','Inkomende IMAP-mail synchroniseren, lezen, beantwoorden en archiveren','Synchronise, read, reply to and archive incoming IMAP email',180),
('corporate.staff-mailbox','Corporate Admin','Medewerker en persoonlijke mailbox toevoegen met standaardhandtekening','Add a staff member and personal mailbox with a default signature',181)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
