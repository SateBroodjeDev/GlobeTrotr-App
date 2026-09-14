-- Finale structurele notificatie-audit na 20260908058000_trip_content_notifications.sql.
-- Controleert rechten, RLS, typen, triggers en de service-role opslagroute.
BEGIN;
DO $$
DECLARE v_definition TEXT;v_missing TEXT;
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.notifications'::regclass) THEN
  RAISE EXCEPTION 'RLS staat niet aan op notifications';
 END IF;
 IF has_table_privilege('anon','public.notifications','SELECT')
  OR has_table_privilege('authenticated','public.notifications','INSERT')
  OR has_table_privilege('authenticated','public.notifications','DELETE') THEN
  RAISE EXCEPTION 'Een browserrol heeft te ruime rechten op notifications';
 END IF;
 IF NOT has_table_privilege('authenticated','public.notifications','SELECT')
  OR NOT has_column_privilege('authenticated','public.notifications','dismissed_at','UPDATE') THEN
  RAISE EXCEPTION 'Ontvangers kunnen hun meldingen niet lezen of wegklikken';
 END IF;
 SELECT pg_get_constraintdef(oid) INTO v_definition FROM pg_constraint
 WHERE conrelid='public.notifications'::regclass AND conname='notifications_kind_check';
 FOREACH v_missing IN ARRAY ARRAY['account','trip_change','invitation','membership','feedback','platform',
  'agency_task','agency_quote','agency_access','trip_document','agency_client','trip_access','trip_booking','trip_expense']
 LOOP
  IF v_definition IS NULL OR position(quote_literal(v_missing) IN v_definition)=0 THEN
   RAISE EXCEPTION 'Meldingstype % ontbreekt in notifications_kind_check',v_missing;
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND (
  (tgrelid='public.profiles'::regclass AND tgname='profiles_notify_change') OR
  (tgrelid='public.workspaces'::regclass AND tgname='workspaces_notify_plan') OR
  (tgrelid='public.trip_invitations'::regclass AND tgname IN('invitations_notify','invitations_notify_response')) OR
  (tgrelid='public.workspace_invitations'::regclass AND tgname='workspace_invitations_notify') OR
  (tgrelid='public.trip_members'::regclass AND tgname IN('trip_members_notify_removal','trip_members_notify_access_change')) OR
  (tgrelid='public.trip_travel_items'::regclass AND tgname='notify_trip_booking_change') OR
  (tgrelid='public.trip_expenses'::regclass AND tgname='notify_trip_expense_change') OR
  (tgrelid='public.trip_documents'::regclass AND tgname='notify_trip_document_change') OR
  (tgrelid='public.platform_announcements'::regclass AND tgname='platform_announcements_notify')
 ))<>11 THEN RAISE EXCEPTION 'Een verplichte notificatietrigger ontbreekt';END IF;
 IF has_function_privilege('anon','public.save_trip_snapshot_versioned_as(uuid,uuid,jsonb)','EXECUTE')
  OR has_function_privilege('authenticated','public.save_trip_snapshot_versioned_as(uuid,uuid,jsonb)','EXECUTE')
  OR NOT has_function_privilege('service_role','public.save_trip_snapshot_versioned_as(uuid,uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'De actorbewuste snapshotfunctie heeft onjuiste uitvoerrechten';
 END IF;
END $$;
ROLLBACK;
