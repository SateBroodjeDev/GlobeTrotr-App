-- Uitvoeren na 20260908054000_agency_quote_lifecycle.sql. Alles wordt teruggedraaid.
BEGIN;
CREATE TEMP TABLE qlc AS SELECT gen_random_uuid() owner_id,gen_random_uuid() planner_id,
 gen_random_uuid() workspace_id,gen_random_uuid() client_id;
INSERT INTO auth.users(id,email,email_confirmed_at) SELECT owner_id,'quote-life-owner@example.invalid',now() FROM qlc
 UNION ALL SELECT planner_id,'quote-life-planner@example.invalid',now() FROM qlc;
INSERT INTO public.workspaces(user_id,workspace_uuid,plan,data) SELECT owner_id,workspace_id,'agency','{}'::JSONB FROM qlc;
INSERT INTO public.workspace_members(workspace_uuid,user_id,role,status,joined_at,permission_overrides)
 SELECT workspace_id,planner_id,'advisor','active',now(),'{"trips_plan":true,"trips_view":true}'::JSONB FROM qlc;
INSERT INTO public.agency_clients(id,workspace_uuid,full_name,status,locale)
 SELECT client_id,workspace_id,'Offerteklant','active','nl' FROM qlc;
DO $$ DECLARE v_owner UUID;v_planner UUID;v_workspace UUID;v_client UUID;v_quote UUID;BEGIN
 SELECT owner_id,planner_id,workspace_id,client_id INTO v_owner,v_planner,v_workspace,v_client FROM qlc;
 SELECT public.save_agency_quote(v_workspace,NULL,jsonb_build_object('clientId',v_client,'tripId','','title','Auditofferte','introduction','','currency','EUR','status','ready','validUntil',(current_date+14)::TEXT),
  '[{"name":"Basis","description":"","amount":100}]'::JSONB,v_planner) INTO v_quote;
 PERFORM public.prepare_agency_quote_share(v_workspace,v_quote,repeat('a',64),now()+interval '7 days',v_planner);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND body='shared|Offerteklant|Auditofferte|') THEN RAISE EXCEPTION 'Deelmelding ontbreekt';END IF;
 PERFORM public.prepare_agency_quote_share(v_workspace,v_quote,repeat('b',64),now()+interval '8 days',v_planner);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND body='renewed|Offerteklant|Auditofferte|') THEN RAISE EXCEPTION 'Vernieuwmelding ontbreekt';END IF;
 PERFORM public.revoke_agency_quote_share(v_workspace,v_quote,v_planner);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=v_owner AND body='revoked|Offerteklant|Auditofferte|') THEN RAISE EXCEPTION 'Intrekkingsmelding ontbreekt';END IF;
 IF (SELECT count(*) FROM public.agency_audit_log WHERE target_id=v_quote::TEXT AND action IN('quote.create','quote.share_shared','quote.share_renewed','quote.share_revoke'))<>4 THEN RAISE EXCEPTION 'Offerte-auditcyclus is niet volledig';END IF;
END $$;
ROLLBACK;
