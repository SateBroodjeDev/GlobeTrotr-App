BEGIN;

UPDATE public.release_checklist_items
SET label_nl = 'Ontvangen HTML-mail met lange inhoud en externe afbeeldingen testen: groot leesvenster, afbeeldingen alleen na toestemming en duidelijke privacyuitleg',
    label_en = 'Test received HTML email with long content and external images: larger reading area, images only after an explicit choice and clear privacy explanation',
    updated_at = now()
WHERE item_key = 'corporate.mail-html';

COMMIT;
