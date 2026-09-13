-- Agency-rapportage-instellingen en configureerbare herinneringen.
BEGIN;
CREATE TABLE public.agency_automation_settings(
 workspace_uuid UUID PRIMARY KEY REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 task_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
 task_reminder_days INTEGER NOT NULL DEFAULT 3 CHECK(task_reminder_days BETWEEN 1 AND 30),
 quote_expiry_enabled BOOLEAN NOT NULL DEFAULT true,
 quote_expiry_days INTEGER NOT NULL DEFAULT 3 CHECK(quote_expiry_days BETWEEN 1 AND 30),
 document_expiry_enabled BOOLEAN NOT NULL DEFAULT true,
 document_expiry_days INTEGER NOT NULL DEFAULT 30 CHECK(document_expiry_days BETWEEN 1 AND 180),
 updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_automation_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_automation_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.agency_automation_settings TO authenticated;
GRANT ALL ON public.agency_automation_settings TO service_role;
CREATE POLICY "Agency reads automation" ON public.agency_automation_settings FOR SELECT TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_view')));
CREATE POLICY "Agency planners manage automation" ON public.agency_automation_settings FOR ALL TO authenticated USING((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan'))) WITH CHECK((SELECT private.workspace_has_permission(workspace_uuid,'trips_plan')));
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
 ('agency.reporting','Agency','Rapportage, offerteconversie en herinneringsinstellingen controleren','Verify reporting, quote conversion and reminder settings',75)
ON CONFLICT(item_key) DO UPDATE SET label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,category=EXCLUDED.category,position=EXCLUDED.position,updated_at=now();
COMMIT;
