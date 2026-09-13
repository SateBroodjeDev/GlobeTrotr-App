-- Operationele governance voor privacyverzoeken, featureflags en incidenten.
BEGIN;

CREATE TABLE public.platform_feature_flags(
  flag_key TEXT PRIMARY KEY CHECK(flag_key~'^[a-z][a-z0-9_.-]{2,79}$'),
  label_nl TEXT NOT NULL CHECK(char_length(label_nl) BETWEEN 2 AND 120),
  label_en TEXT NOT NULL CHECK(char_length(label_en) BETWEEN 2 AND 120),
  enabled BOOLEAN NOT NULL DEFAULT false,
  audience TEXT NOT NULL DEFAULT 'internal' CHECK(audience IN('internal','beta','all')),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.privacy_requests(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_email TEXT NOT NULL CHECK(char_length(requester_email)<=254),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK(request_type IN('access','correction','deletion','restriction','objection','portability','other')),
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN('received','verifying','processing','completed','rejected')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '1 month',
  closed_at TIMESTAMPTZ,
  notes TEXT CHECK(notes IS NULL OR char_length(notes)<=2000),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_incidents(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK(char_length(title) BETWEEN 3 AND 160),
  severity TEXT NOT NULL CHECK(severity IN('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK(status IN('investigating','identified','monitoring','resolved')),
  summary TEXT NOT NULL CHECK(char_length(summary) BETWEEN 10 AND 3000),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.platform_feature_flags(flag_key,label_nl,label_en,enabled,audience) VALUES
 ('public.registration','Openbare registratie','Public registration',true,'all'),
 ('agency.custom_domains','Eigen Agency-domeinen','Custom Agency domains',false,'internal'),
 ('billing.checkout','Online afrekenen','Online checkout',false,'internal')
ON CONFLICT(flag_key) DO NOTHING;
ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_feature_flags,public.privacy_requests,public.platform_incidents FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_feature_flags,public.privacy_requests,public.platform_incidents TO service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
 ('corporate.governance','Corporate Admin','Privacyverzoeken, featureflags en incidentregistratie controleren','Verify privacy requests, feature flags and incident registration',86)
ON CONFLICT(item_key) DO UPDATE SET label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,category=EXCLUDED.category,position=EXCLUDED.position,updated_at=now();
COMMIT;
