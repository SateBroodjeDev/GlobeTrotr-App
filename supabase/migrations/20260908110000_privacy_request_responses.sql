BEGIN;

ALTER TABLE public.privacy_requests
  ADD COLUMN IF NOT EXISTS response_text TEXT
    CHECK(response_text IS NULL OR char_length(response_text) BETWEEN 1 AND 5000),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('corporate.privacy-response','Corporate Admin','Privacyverzoek openen, wijzigen, beantwoorden en vanuit het verzoek de gebruiker openen','Open, update and answer a privacy request and open its user directly',87)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
