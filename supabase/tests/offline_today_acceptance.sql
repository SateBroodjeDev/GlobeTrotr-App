-- Uitvoeren na 20260908163000_offline_today_acceptance.sql. Alleen-lezen.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.release_checklist_items WHERE item_key='trip.offline-today' AND label_nl LIKE '%synchroniseer bewust%' AND label_en LIKE '%sync explicitly%') THEN
   RAISE EXCEPTION 'OFFLINE_TODAY_ACCEPTANCE_MISSING';
 END IF;
END $$;
