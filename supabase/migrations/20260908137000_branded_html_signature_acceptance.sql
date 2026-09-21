BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES(
  'corporate.mail-branding',
  'Corporate Admin',
  'Persoonlijk en gedeeld postvak testen met veilige HTML-handtekening, logo, naam, functie, adres, tagline, website, contactlink, CTA en tekstfallback',
  'Test personal and shared mailboxes with a safe HTML signature, logo, name, role, address, tagline, website, contact link, CTA and text fallback',
  137
)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,
  updated_at=now();

COMMIT;
