-- Uitvoeren na 20260908083000_maintenance_privacy_and_acceptance.sql. Alles wordt teruggedraaid.
BEGIN;
UPDATE public.platform_maintenance SET active=true,starts_at=now(),ends_at=now()+interval '1 hour',reason_nl='Gepland testonderhoud voor GlobeTrotr.',reason_en='Scheduled GlobeTrotr test maintenance.' WHERE singleton;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_maintenance WHERE singleton AND active AND ends_at>starts_at) THEN RAISE EXCEPTION 'MAINTENANCE_STATE_INVALID'; END IF;
 IF (SELECT count(*) FROM public.release_checklist_items WHERE item_key IN('public.maintenance','account.privacy-request','corporate.testimonials','ui.avatars','public.value-story','privacy.server-proxy'))<>6 THEN RAISE EXCEPTION 'ACCEPTANCE_ITEMS_MISSING'; END IF;
END $$;
ROLLBACK;
