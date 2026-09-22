BEGIN;

INSERT INTO public.release_checklist_items
  (item_key, category, label_nl, label_en, position)
VALUES
  ('public.launch-pages', 'Publiek',
   'Publieke opening: homepage, interactieve demo, prijzen, contact, status, About, privacy, voorwaarden, roadmap en updates op telefoon en desktop in NL/EN controleren',
   'Public launch: review home, interactive demo, pricing, contact, status, About, privacy, terms, roadmap and updates on mobile and desktop in NL/EN', 454),
  ('agency.domain-dns-https', 'Agency',
   'Agency-subdomein en eigen domein: DNS, certificaat, dashboard, inloggen en klanttoegang met een echt domein controleren',
   'Verify Agency subdomain and custom domain DNS, certificate, dashboard, sign-in and client access with a real domain', 455)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
