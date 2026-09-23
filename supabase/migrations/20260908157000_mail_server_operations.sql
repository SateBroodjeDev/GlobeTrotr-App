BEGIN;

INSERT INTO public.platform_status_components(component_key,name_nl,name_en) VALUES
('mail_server','Mailserver','Mail server')
ON CONFLICT(component_key) DO UPDATE SET name_nl=EXCLUDED.name_nl,name_en=EXCLUDED.name_en;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('corporate.mail-server-operations','Corporate Admin',
 'Mailserverstatus, provisioningfout, handmatige herstart en veilig uitschakelen van postvak testen',
 'Test mail server status, provisioning error, manual retry and safe mailbox disabling',221)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
 label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
