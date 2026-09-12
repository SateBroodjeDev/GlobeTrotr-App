-- Uitvoeren na 20260908066000_platform_operations_and_release_checklist.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ DECLARE v_status JSONB;BEGIN
 SELECT public.get_public_platform_status() INTO v_status;
 IF jsonb_array_length(v_status->'components')<>7 THEN RAISE EXCEPTION 'Publieke componentlijst is onvolledig';END IF;
 IF v_status::TEXT LIKE '%2.28.36.231%' OR v_status::TEXT LIKE '%178.105.243.191%' THEN RAISE EXCEPTION 'Publieke status lekt server-IP-adressen';END IF;
 IF (SELECT count(*) FROM public.infrastructure_servers)<>2 THEN RAISE EXCEPTION 'Serverinventaris ontbreekt';END IF;
 IF EXISTS(SELECT 1 FROM public.infrastructure_servers WHERE ssh_public_key IS NOT NULL) THEN RAISE EXCEPTION 'Er is onverwacht sleutelmateriaal opgeslagen';END IF;
 IF (SELECT count(*) FROM public.release_checklist_items)<15 THEN RAISE EXCEPTION 'Releasechecklist is onvolledig';END IF;
 IF has_table_privilege('authenticated','public.infrastructure_servers','SELECT') OR has_table_privilege('anon','public.platform_status_components','SELECT') THEN RAISE EXCEPTION 'Interne operationele tabellen zijn direct leesbaar';END IF;
 IF NOT has_function_privilege('anon','public.get_public_platform_status()','EXECUTE') THEN RAISE EXCEPTION 'Publieke status-RPC is niet beschikbaar';END IF;
END $$;
ROLLBACK;
