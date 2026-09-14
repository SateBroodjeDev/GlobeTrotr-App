BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('mail.auth-confirmation','Communicatie','Registratiebevestiging met GlobeTrotr-opmaak en eigen tokenroute controleren','Verify signup confirmation with GlobeTrotr styling and first-party token route',130),
('mail.auth-recovery','Communicatie','Wachtwoordherstelmail en instellen van een nieuw wachtwoord controleren','Verify password recovery email and setting a new password',131),
('mail.auth-email-change','Communicatie','E-mailwijziging, veiligheidsmelding en bevestiging op het nieuwe adres controleren','Verify email change, security notice and confirmation at the new address',132),
('mail.auth-magic-link','Communicatie','Eenmalige magic link, afloop en hergebruikbeveiliging controleren','Verify single-use magic link, expiry and replay protection',133),
('mail.visual-consistency','Communicatie','Auth-, uitnodigings- en servicemail op telefoon, desktop en donkere mailclient controleren','Verify Auth, invitation and service email on mobile, desktop and a dark email client',134)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
