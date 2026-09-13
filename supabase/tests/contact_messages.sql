-- Uitvoeren na 20260908076000_contact_message_management.sql. Alles wordt teruggedraaid.
BEGIN;
INSERT INTO public.contact_messages(name,email,subject,message,category,locale) VALUES('Contacttester','contact@example.invalid','Vraag over GlobeTrotr','Dit is een geldig testbericht met voldoende lengte.','feedback','nl');
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.contact_messages WHERE email='contact@example.invalid' AND category='feedback' AND status='new' AND updated_at IS NOT NULL) THEN RAISE EXCEPTION 'Contactbericht of beheerstatus ontbreekt'; END IF;
  IF has_table_privilege('anon','public.contact_messages','SELECT') OR has_table_privilege('authenticated','public.contact_messages','SELECT') THEN RAISE EXCEPTION 'Contactberichten zijn rechtstreeks uitleesbaar'; END IF;
END; $$;
ROLLBACK;
