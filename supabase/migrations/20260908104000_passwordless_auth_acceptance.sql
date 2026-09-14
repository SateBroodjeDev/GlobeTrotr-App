BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('auth.password-recovery-entry','Account','Wachtwoord vergeten aanvragen en nieuw wachtwoord instellen controleren','Verify requesting password recovery and setting a new password',140),
('auth.magic-link-entry','Account','Magic link aanvragen, eenmalig gebruiken en terugkeerroute controleren','Verify requesting a magic link, single use and return route',141)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
