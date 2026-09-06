ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS share_pin_hash TEXT;
