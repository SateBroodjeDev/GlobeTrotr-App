-- Tijdgebonden meldingen en het automatisch sluiten van verlopen uitnodigingen.
-- Deze service-role functie is klaar voor een dagelijkse cronjob op de eigen VPS.
-- Uitvoeren na 20260908058000_trip_content_notifications.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.run_notification_maintenance(p_now TIMESTAMPTZ DEFAULT now())
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_closed INTEGER:=0;v_tasks INTEGER:=0;v_documents INTEGER:=0;v_quotes INTEGER:=0;
BEGIN
  -- Verlopen uitnodigingen blijven als auditdata bestaan, maar zijn niet langer
  -- als open actie zichtbaar in het notificatiepaneel.
  UPDATE public.notifications notification SET dismissed_at=COALESCE(notification.dismissed_at,p_now)
  FROM public.trip_invitations invitation
  WHERE notification.event_key='invitation:'||invitation.id::TEXT
    AND notification.dismissed_at IS NULL AND invitation.expires_at<=p_now
    AND invitation.accepted_at IS NULL AND invitation.declined_at IS NULL AND invitation.revoked_at IS NULL;
  GET DIAGNOSTICS v_closed=ROW_COUNT;
  UPDATE public.notifications notification SET dismissed_at=COALESCE(notification.dismissed_at,p_now)
  FROM public.workspace_invitations invitation
  WHERE notification.event_key='workspace-invitation:'||invitation.id::TEXT
    AND notification.dismissed_at IS NULL AND invitation.expires_at<=p_now
    AND invitation.accepted_at IS NULL AND invitation.declined_at IS NULL AND invitation.revoked_at IS NULL;
  GET DIAGNOSTICS v_tasks=ROW_COUNT;
  v_closed:=v_closed+v_tasks;v_tasks:=0;

  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  SELECT task.assignee_user_id,'agency_task','Deadline nadert / Deadline approaching',
    'due|'||left(replace(task.title,'|',''),120)||'|'||task.due_date::TEXT,
    task.trip_uuid,'agency-task-due:'||task.id::TEXT
  FROM public.agency_tasks task
  WHERE task.assignee_user_id IS NOT NULL AND task.status IN('open','in_progress')
    AND task.due_date BETWEEN p_now::DATE AND p_now::DATE+1
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    trip_uuid=EXCLUDED.trip_uuid,created_at=p_now,dismissed_at=NULL;
  GET DIAGNOSTICS v_tasks=ROW_COUNT;

  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key)
  SELECT recipient.user_id,'trip_document','Document verloopt binnenkort / Document expires soon',
    'expires|'||left(replace(document.file_name,'|',''),200)||'|'||document.expires_on::TEXT,
    document.trip_uuid,'trip-document-expiry:'||document.id::TEXT
  FROM public.trip_documents document
  JOIN public.trips trip ON trip.trip_uuid=document.trip_uuid
  CROSS JOIN LATERAL (
    SELECT trip.workspace_user_id AS user_id
    UNION SELECT member.user_id FROM public.trip_members member
      WHERE member.trip_uuid=trip.trip_uuid AND member.status='active' AND member.user_id IS NOT NULL
  ) recipient
  WHERE document.expires_on BETWEEN p_now::DATE AND p_now::DATE+30
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    trip_uuid=EXCLUDED.trip_uuid,created_at=p_now,dismissed_at=NULL;
  GET DIAGNOSTICS v_documents=ROW_COUNT;

  INSERT INTO public.notifications(user_id,kind,title,body,event_key)
  SELECT workspace.user_id,'agency_quote','Offerte verloopt binnenkort / Quote expires soon',
    'expiry|'||left(replace(quote.title,'|',''),120)||'|'||quote.valid_until::TEXT,
    'agency-quote-expiry:'||quote.id::TEXT
  FROM public.agency_quotes quote JOIN public.workspaces workspace ON workspace.workspace_uuid=quote.workspace_uuid
  WHERE quote.status IN('draft','ready') AND quote.valid_until BETWEEN p_now::DATE AND p_now::DATE+3
  ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
    created_at=p_now,dismissed_at=NULL;
  GET DIAGNOSTICS v_quotes=ROW_COUNT;
  RETURN jsonb_build_object('closedInvitations',v_closed,'taskReminders',v_tasks,
    'documentReminders',v_documents,'quoteReminders',v_quotes,'processedAt',p_now);
END $$;

REVOKE ALL ON FUNCTION public.run_notification_maintenance(TIMESTAMPTZ) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_notification_maintenance(TIMESTAMPTZ) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
