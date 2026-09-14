BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES
 ('trip.gpx-production','Reizen','GPX downloaden en in een kaartapp openen','Download GPX and open it in a mapping app',174),
 ('trip.guide-production','Reizen','Reisgids downloaden en volledig openen','Download and fully open the trip guide',175),
 ('trip.settlement-linked-members','Reizen','Betaalverzoek naar gekoppelde reisaccounts controleren','Verify a payment request to linked trip accounts',176),
 ('corporate.mail-default-signature','Corporate Admin','Standaardhandtekening van een gedeelde en persoonlijke mailbox controleren','Verify the default signature for a shared and personal mailbox',177),
 ('mail.auth-production','Communicatie','Registratie, herstel en magic link via productie-SMTP controleren','Verify registration, recovery and magic link through production SMTP',178),
 ('mail.agency-branding','Agency','Agency-uitnodiging met organisatienaam en accentkleur controleren','Verify an Agency invitation with organisation name and accent colour',179)
ON CONFLICT(item_key) DO UPDATE SET
 category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
 position=EXCLUDED.position,updated_at=now();

COMMIT;
