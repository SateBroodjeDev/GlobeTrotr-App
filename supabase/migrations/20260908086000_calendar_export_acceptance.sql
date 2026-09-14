BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('trip.calendar-export','Reizen','Reisagenda als ICS exporteren en openen in Apple Calendar, Google Calendar en Outlook','Export a trip calendar as ICS and open it in Apple Calendar, Google Calendar and Outlook',318)
ON CONFLICT(item_key) DO UPDATE SET
 category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
 position=EXCLUDED.position,updated_at=now();

COMMIT;
