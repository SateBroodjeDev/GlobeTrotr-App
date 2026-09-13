-- Laat de bestaande dagelijkse onderhoudstaak de Agency-instellingen toepassen.
BEGIN;
CREATE OR REPLACE FUNCTION public.run_notification_maintenance(p_now TIMESTAMPTZ DEFAULT now())
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_closed INTEGER:=0;v_part INTEGER:=0;v_tasks INTEGER:=0;v_documents INTEGER:=0;v_quotes INTEGER:=0;
BEGIN
 UPDATE public.notifications n SET dismissed_at=COALESCE(n.dismissed_at,p_now) FROM public.trip_invitations i
 WHERE n.event_key='invitation:'||i.id::TEXT AND n.dismissed_at IS NULL AND i.expires_at<=p_now AND i.accepted_at IS NULL AND i.declined_at IS NULL AND i.revoked_at IS NULL;
 GET DIAGNOSTICS v_closed=ROW_COUNT;
 UPDATE public.notifications n SET dismissed_at=COALESCE(n.dismissed_at,p_now) FROM public.workspace_invitations i
 WHERE n.event_key='workspace-invitation:'||i.id::TEXT AND n.dismissed_at IS NULL AND i.expires_at<=p_now AND i.accepted_at IS NULL AND i.declined_at IS NULL AND i.revoked_at IS NULL;
 GET DIAGNOSTICS v_part=ROW_COUNT;v_closed:=v_closed+v_part;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 SELECT t.assignee_user_id,'agency_task','Deadline nadert / Deadline approaching','due|'||left(replace(t.title,'|',''),120)||'|'||t.due_date::TEXT,t.trip_uuid,'agency-task-due:'||t.id::TEXT
 FROM public.agency_tasks t LEFT JOIN public.agency_automation_settings s ON s.workspace_uuid=t.workspace_uuid
 WHERE COALESCE(s.task_reminders_enabled,true) AND t.assignee_user_id IS NOT NULL AND t.status IN('open','in_progress') AND t.due_date BETWEEN p_now::DATE AND p_now::DATE+COALESCE(s.task_reminder_days,3)
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=p_now,dismissed_at=NULL;
 GET DIAGNOSTICS v_tasks=ROW_COUNT;
 INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
 SELECT recipient.user_id,'trip_document','Document verloopt binnenkort / Document expires soon','expires|'||left(replace(d.file_name,'|',''),200)||'|'||d.expires_on::TEXT,d.trip_uuid,'trip-document-expiry:'||d.id::TEXT
 FROM public.trip_documents d JOIN public.trips t ON t.trip_uuid=d.trip_uuid LEFT JOIN public.agency_automation_settings s ON s.workspace_uuid=t.workspace_uuid
 CROSS JOIN LATERAL(SELECT t.workspace_user_id user_id UNION SELECT m.user_id FROM public.trip_members m WHERE m.trip_uuid=t.trip_uuid AND m.status='active' AND m.user_id IS NOT NULL)recipient
 WHERE COALESCE(s.document_expiry_enabled,true) AND d.expires_on BETWEEN p_now::DATE AND p_now::DATE+COALESCE(s.document_expiry_days,30)
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,trip_uuid=EXCLUDED.trip_uuid,created_at=p_now,dismissed_at=NULL;
 GET DIAGNOSTICS v_documents=ROW_COUNT;
 INSERT INTO public.notifications(user_id,kind,title,body,event_key)
 SELECT w.user_id,'agency_quote','Offerte verloopt binnenkort / Quote expires soon','expiry|'||left(replace(q.title,'|',''),120)||'|'||q.valid_until::TEXT,'agency-quote-expiry:'||q.id::TEXT
 FROM public.agency_quotes q JOIN public.workspaces w ON w.workspace_uuid=q.workspace_uuid LEFT JOIN public.agency_automation_settings s ON s.workspace_uuid=q.workspace_uuid
 WHERE COALESCE(s.quote_expiry_enabled,true) AND q.status IN('draft','ready') AND q.valid_until BETWEEN p_now::DATE AND p_now::DATE+COALESCE(s.quote_expiry_days,3)
 ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,created_at=p_now,dismissed_at=NULL;
 GET DIAGNOSTICS v_quotes=ROW_COUNT;
 RETURN jsonb_build_object('closedInvitations',v_closed,'taskReminders',v_tasks,'documentReminders',v_documents,'quoteReminders',v_quotes,'processedAt',p_now);
END $$;
REVOKE ALL ON FUNCTION public.run_notification_maintenance(TIMESTAMPTZ) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_notification_maintenance(TIMESTAMPTZ) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
