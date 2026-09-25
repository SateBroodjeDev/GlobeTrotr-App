BEGIN;

CREATE TABLE IF NOT EXISTS public.stored_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('supabase', 'hetzner_s3')),
  bucket TEXT NOT NULL CHECK (bucket ~ '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$'),
  object_key TEXT NOT NULL CHECK (
    char_length(object_key) BETWEEN 3 AND 512
    AND object_key !~ '(^/|(^|/)\.\.(/|$))'
  ),
  purpose TEXT NOT NULL CHECK (purpose IN ('journal_photo', 'trip_document', 'receipt', 'mail_attachment')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
  trip_uuid UUID REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (char_length(mime_type) BETWEEN 3 AND 120),
  size_bytes BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 20971520),
  sha256 TEXT CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'available', 'quarantined', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE (provider, bucket, object_key),
  CHECK ((status = 'available') = (available_at IS NOT NULL) OR status IN ('deleted', 'quarantined')),
  CHECK ((status = 'deleted') = (deleted_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS stored_objects_trip_status_idx
  ON public.stored_objects(trip_uuid, status, created_at DESC)
  WHERE trip_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS stored_objects_workspace_status_idx
  ON public.stored_objects(workspace_uuid, status, created_at DESC);

ALTER TABLE public.stored_objects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stored_objects FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.stored_objects TO service_role;

COMMENT ON TABLE public.stored_objects IS
  'Server-only provider-independent metadata. Access to object contents is granted with short-lived URLs after an application authorization check.';

INSERT INTO public.release_checklist_items(item_key, category, label_nl, label_en, position)
VALUES(
  'storage.provider-gateway',
  'Infrastructuur',
  'Controleren dat externe objectopslag uit blijft tot de private servergateway, scan en hersteltest zijn geaccepteerd',
  'Verify external object storage remains disabled until the private server gateway, scan and restore test are accepted',
  181
)
ON CONFLICT(item_key) DO UPDATE SET
  category = EXCLUDED.category,
  label_nl = EXCLUDED.label_nl,
  label_en = EXCLUDED.label_en,
  position = EXCLUDED.position,
  updated_at = now();

COMMIT;
