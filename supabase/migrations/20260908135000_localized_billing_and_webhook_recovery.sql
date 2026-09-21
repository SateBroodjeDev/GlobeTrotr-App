BEGIN;

-- Store Paddle account notifications in the recipient's selected language.
-- The mail outbox is queued after this BEFORE trigger and therefore receives
-- the same localized copy.
CREATE OR REPLACE FUNCTION private.localize_paddle_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_english BOOLEAN;
BEGIN
  IF NEW.kind = 'account' AND NEW.event_key LIKE 'paddle-%' THEN
    SELECT p.locale = 'en-GB' INTO v_english
    FROM public.profiles p WHERE p.id = NEW.user_id;
    v_english := COALESCE(v_english, false);
    IF position(' / ' IN NEW.title) > 0 THEN
      NEW.title := CASE WHEN v_english THEN split_part(NEW.title, ' / ', 2)
        ELSE split_part(NEW.title, ' / ', 1) END;
    END IF;
    IF position(' / ' IN NEW.body) > 0 THEN
      NEW.body := CASE WHEN v_english THEN split_part(NEW.body, ' / ', 2)
        ELSE split_part(NEW.body, ' / ', 1) END;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.localize_paddle_notification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS localize_paddle_notification ON public.notifications;
CREATE TRIGGER localize_paddle_notification
BEFORE INSERT OR UPDATE OF title, body ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.localize_paddle_notification();

-- Repair existing open Paddle notifications. Sent email rows remain immutable;
-- open or queued messages inherit this update through the existing outbox trigger.
UPDATE public.notifications n
SET title = CASE WHEN p.locale = 'en-GB' THEN split_part(n.title, ' / ', 2)
    ELSE split_part(n.title, ' / ', 1) END,
    body = CASE WHEN p.locale = 'en-GB' THEN split_part(n.body, ' / ', 2)
    ELSE split_part(n.body, ' / ', 1) END
FROM public.profiles p
WHERE p.id = n.user_id AND n.kind = 'account' AND n.event_key LIKE 'paddle-%'
  AND (position(' / ' IN n.title) > 0 OR position(' / ' IN n.body) > 0);

-- Keep audit payloads, but requeue only webhook rows blocked by the exact
-- discounted-total constraint fixed in 1330/1340. A verified retry or the
-- Corporate Admin reprocess action must still complete them.
UPDATE public.billing_webhook_events
SET status = 'failed', attempts = 0, processed_at = NULL
WHERE provider = 'paddle' AND status = 'failed'
  AND event_type = 'transaction.completed'
  AND last_error_code LIKE '23514:%billing_transactions_check1%'
  AND payload->'data'->'custom_data'->>'checkout_binding' IS NOT NULL;

-- A process restart between claiming and finishing an event must not leave a
-- permanent `processing` row in Corporate Admin.
UPDATE public.billing_webhook_events
SET status = 'failed', last_error_code = 'WEBHOOK_PROCESSING_INTERRUPTED'
WHERE provider = 'paddle' AND status = 'processing'
  AND received_at < now() - interval '10 minutes';

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES (
  'billing.localized-copy-and-retry', 'Betaling',
  'Paddle-melding in één profieltaal, MRR-uitleg en herstelde webhookwachtrij controleren',
  'Verify single-language Paddle copy, MRR explanation and recovered webhook queue',
  235
)
ON CONFLICT (item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
