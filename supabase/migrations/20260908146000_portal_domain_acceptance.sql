BEGIN;

INSERT INTO public.release_checklist_items
  (item_key, category, label_nl, label_en, position)
VALUES
  ('public.portal-hosts', 'Publiek',
   'Domeinscheiding: homepage op globetrotr.nl, account en registratie op portal.globetrotr.nl, oude links en openbare reizen testen',
   'Test domain split: homepage on globetrotr.nl, account and registration on portal.globetrotr.nl, legacy links and public trips', 456),
  ('auth.portal-cutover', 'Account',
   'Portalverhuizing: eenmalig opnieuw inloggen, bevestigingsmail, herstel, magic link, Google, Discord, MFA en bestaande passkeys testen',
   'Test portal move: one-time sign-in, confirmation, recovery, magic link, Google, Discord, MFA and existing passkeys', 457),
  ('agency.domain-tenant-binding', 'Agency',
   'Agency-hostnaam: juiste workspace en huisstijl op iedere route en geen toegang via een andere Agency-host verifiëren vóór vrijgave',
   'Verify Agency hostname resolves the right workspace and branding on every route and cannot expose another Agency before launch', 458)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
