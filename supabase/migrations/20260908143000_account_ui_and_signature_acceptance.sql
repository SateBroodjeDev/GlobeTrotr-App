BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-signature-admin','Corporate Admin',
 'Handtekening van een persoonlijk en gedeeld postvak alleen in Corporate Admin wijzigen; uitgaande HTML-mail controleren',
 'Change personal and shared mailbox signatures only in Corporate Admin; verify outgoing HTML mail',190),
('account.security-dialogs','Accounts en toegang',
 'Passkeys en wachtwoord wijzigen in afzonderlijke vensters; privacyverzoek indienen zonder lange formulierpagina',
 'Manage passkeys and password in separate dialogs; submit a privacy request without a long form page',451),
('public.production-copy','Publiek',
 'Homepage, demo en dashboard op actuele betaalde productievoorwaarden en juiste actieve reisaantallen controleren',
 'Check home, demo and dashboard copy against paid production terms and accurate active trip counts',106)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
