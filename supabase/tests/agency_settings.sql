-- Uitvoeren na 20260908032000_agency_settings_and_logo.sql.
-- Controleert standaardwaarden, limieten, eigenaarschap en veilige logopaden.
BEGIN;
CREATE TEMP TABLE agency_settings_ids AS SELECT gen_random_uuid() owner_id,gen_random_uuid() outsider_id,gen_random_uuid() workspace_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'settings-owner@example.invalid',now() FROM agency_settings_ids UNION ALL SELECT outsider_id,'outsider@example.invalid',now() FROM agency_settings_ids;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM agency_settings_ids;
DO $$ DECLARE ids agency_settings_ids%ROWTYPE; result JSONB; BEGIN
 SELECT * INTO ids FROM agency_settings_ids;
 result:=public.get_agency_settings(ids.owner_id);
 IF result->>'systemName'<>'GlobeTrotr Agency' OR result->>'currency'<>'EUR' THEN RAISE EXCEPTION 'Veilige standaardwaarden ontbreken'; END IF;
 result:=public.save_agency_settings(ids.owner_id,jsonb_build_object('systemName','Test Agency','senderName','Testteam','contactEmail','team@example.invalid','defaultLocale','en','timezone','Europe/Amsterdam','currency','EUR','domain','test.example','tagline','Travel together','accent',210,'logoPath',ids.workspace_id::TEXT||'/logo.webp'));
 IF NOT (result->>'ok')::BOOLEAN OR NOT EXISTS(SELECT 1 FROM public.agency_settings WHERE workspace_uuid=ids.workspace_id AND system_name='Test Agency' AND logo_path=ids.workspace_id::TEXT||'/logo.webp') THEN RAISE EXCEPTION 'Instellingen zijn niet opgeslagen'; END IF;
 IF public.get_agency_settings(ids.outsider_id) IS NOT NULL THEN RAISE EXCEPTION 'Buitenstaander leest Agency-instellingen'; END IF;
 BEGIN
  PERFORM public.save_agency_settings(ids.owner_id,jsonb_build_object('systemName',repeat('x',51),'senderName','Test','contactEmail','team@example.invalid','defaultLocale','nl','timezone','Europe/Amsterdam','currency','EUR','domain','test.example','tagline','Test','accent',172));
  RAISE EXCEPTION 'Te lange systeemnaam geaccepteerd'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Te lange systeemnaam geaccepteerd' THEN RAISE; END IF;
 END;
END $$;
ROLLBACK;
