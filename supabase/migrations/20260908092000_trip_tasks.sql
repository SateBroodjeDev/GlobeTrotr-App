BEGIN;
CREATE TABLE public.trip_tasks(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 2 AND 160),
  assignee_name TEXT CHECK(assignee_name IS NULL OR char_length(assignee_name)<=100),
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trip_tasks_trip_order_idx ON public.trip_tasks(trip_uuid,completed,due_date);
ALTER TABLE public.trip_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_tasks FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_tasks TO service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.tasks','Reizen','Gezamenlijke reistaken, verantwoordelijke, deadline en rechten controleren','Verify shared trip tasks, assignee, deadline and permissions',119)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
