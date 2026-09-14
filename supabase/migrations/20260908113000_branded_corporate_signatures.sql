BEGIN;

UPDATE public.corporate_mailboxes
SET signature_text = display_name || E'\nGlobeTrotr\nPlan every trip. Track every euro.\nPlan je reis / Plan your trip: https://globetrotr.nl\nContact: https://globetrotr.nl/contact',
    updated_at = now()
WHERE signature_text IS NULL
   OR signature_text = display_name || E'\nGlobeTrotr\nPlan every trip. Track every euro.\nhttps://globetrotr.nl';

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('corporate.mail-branding','Corporate Admin','Persoonlijke en gedeelde mailbox testen met logo, tagline, links, CTA en eigen handtekening','Test personal and shared mailboxes with logo, tagline, links, CTA and a personal signature',182)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
