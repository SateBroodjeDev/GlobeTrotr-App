BEGIN;

ALTER TABLE public.trip_tasks
  ADD COLUMN category TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN list_name TEXT;

ALTER TABLE public.trip_tasks
  ADD CONSTRAINT trip_tasks_category_check
    CHECK(category IN ('task','departure','shopping','custom')),
  ADD CONSTRAINT trip_tasks_list_name_check
    CHECK(list_name IS NULL OR char_length(btrim(list_name)) BETWEEN 2 AND 80),
  ADD CONSTRAINT trip_tasks_custom_name_check
    CHECK(category <> 'custom' OR list_name IS NOT NULL);

CREATE INDEX trip_tasks_trip_category_order_idx
  ON public.trip_tasks(trip_uuid,category,completed,due_date);

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.general-checklists','Reisplanning',
  'Gedeelde taken-, vertrek-, boodschappen- en eigen checklists aanmaken, afvinken, herladen en met verschillende reisrollen controleren',
  'Create, complete and reload shared task, departure, shopping and custom checklists and verify them with different trip roles',479)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
