BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES(
  'content.translation',
  'Communicatie',
  'NL→EN en EN→NL-concepten voor feedback, antwoorden, platformmeldingen, bekende problemen, onderhoud, recensies en inkomende/uitgaande bedrijfsmail controleren en handmatig corrigeren',
  'Verify and manually correct NL→EN and EN→NL drafts for feedback, replies, platform notices, known issues, maintenance, testimonials and incoming/outgoing company mail',
  136
)
ON CONFLICT(item_key) DO UPDATE SET
  category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,
  updated_at=now();

COMMIT;
