BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('account.email-change-notification','Account','Wijziging van e-mailadres aanvragen en de blijvende beveiligingsmelding controleren','Request an email address change and verify the persistent security notification',206),
('account.password-change-notification','Account','Wachtwoord wijzigen en de blijvende beveiligingsmelding controleren','Change the password and verify the persistent security notification',207)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,
  updated_at=now();

COMMIT;
