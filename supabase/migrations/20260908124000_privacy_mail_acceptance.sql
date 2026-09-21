BEGIN;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES (
  'privacy.mail-processing','Privacy',
  'Controleer privacyverklaring NL/EN: bedrijfsmail, bijlagen, scan, vertaling, bewaarbeleid en postvakwachtwoorden',
  'Verify privacy notice in NL/EN: company mail, attachments, scanning, translation, retention and mailbox passwords',174
)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();
COMMIT;
