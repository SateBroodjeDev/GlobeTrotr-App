-- Publieke platformstatus en afgeschermd infrastructuur- en releasebeheer.
-- Uitvoeren na 20260908065000_provider_quotas_and_worker_queue.sql.
BEGIN;

CREATE TABLE public.platform_status_components(
  component_key TEXT PRIMARY KEY CHECK(component_key ~ '^[a-z][a-z0-9_-]{1,39}$'),
  name_nl TEXT NOT NULL CHECK(char_length(name_nl) BETWEEN 2 AND 80),
  name_en TEXT NOT NULL CHECK(char_length(name_en) BETWEEN 2 AND 80),
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN('operational','degraded','outage','maintenance','unknown')),
  response_ms INTEGER CHECK(response_ms IS NULL OR response_ms BETWEEN 0 AND 120000),
  checked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.platform_status_components(component_key,name_nl,name_en) VALUES
 ('web','Dashboard en website','Dashboard and website'),('worker','Achtergrondverwerking','Background processing'),
 ('database','Database','Database'),('storage','Bestandsopslag','File storage'),('weather','Weerdata','Weather data'),
 ('rates','Valutakoersen','Exchange rates'),('flights','Vluchtinformatie','Flight information')
ON CONFLICT(component_key) DO UPDATE SET name_nl=EXCLUDED.name_nl,name_en=EXCLUDED.name_en;

CREATE TABLE public.infrastructure_servers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name TEXT NOT NULL UNIQUE CHECK(char_length(name) BETWEEN 2 AND 80),
  server_role TEXT NOT NULL CHECK(server_role IN('web','worker','database','storage','proxy','monitoring')),
  ipv4 INET,ipv6_cidr CIDR,ssh_port INTEGER NOT NULL DEFAULT 22 CHECK(ssh_port BETWEEN 1 AND 65535),
  ssh_user TEXT CHECK(ssh_user IS NULL OR ssh_user ~ '^[a-z_][a-z0-9_-]{0,31}$'),
  ssh_public_key TEXT CHECK(ssh_public_key IS NULL OR (char_length(ssh_public_key) BETWEEN 40 AND 4096 AND ssh_public_key ~ '^(ssh-|ecdsa-|sk-)')),
  host_key_fingerprint TEXT CHECK(host_key_fingerprint IS NULL OR char_length(host_key_fingerprint) BETWEEN 16 AND 160),
  cpu_count SMALLINT CHECK(cpu_count BETWEEN 1 AND 256),memory_mb INTEGER CHECK(memory_mb BETWEEN 256 AND 1048576),
  notes TEXT CHECK(notes IS NULL OR char_length(notes)<=1000),active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.infrastructure_servers(name,server_role,ipv4,ipv6_cidr,cpu_count,memory_mb,notes) VALUES
 ('GBT-Node-01','web','2.28.36.231','2a01:4f8:c015:6edd::/64',2,4096,'Primaire webapp en reverse proxy'),
 ('GBT-Node-02','worker','178.105.243.191','2a01:4f8:c015:46a::/64',4,8192,'Workers, geplande taken en mailrelay')
ON CONFLICT(name) DO NOTHING;

CREATE TABLE public.release_checklist_items(
  item_key TEXT PRIMARY KEY CHECK(item_key ~ '^[a-z][a-z0-9_.-]{2,79}$'),category TEXT NOT NULL,
  label_nl TEXT NOT NULL,label_en TEXT NOT NULL,position INTEGER NOT NULL,completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,notes TEXT CHECK(notes IS NULL OR char_length(notes)<=1000),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
 ('db.migrations','Database','Migraties 580 tot en met 660 in volgorde uitvoeren','Run migrations 580 through 660 in order',10),
 ('db.tests','Database','Alle genoemde SQL-regressietests zonder fout uitvoeren','Run every listed SQL regression test without errors',20),
 ('auth.roles','Toegang','Eigenaar, reiziger, viewer, finance, client en Agency-rollen controleren','Verify owner, traveller, viewer, finance, client and Agency roles',30),
 ('auth.invites','Toegang','Uitnodigen, accepteren, weigeren, intrekken en verwijderen controleren','Verify invite, accept, decline, revoke and removal flows',40),
 ('trip.core','Reizen','Reis maken, wijzigen, delen, archiveren en herstellen controleren','Verify creating, editing, sharing, archiving and restoring trips',50),
 ('trip.money','Reizen','Uitgaven, privacy, bonnetjes, export en verrekening controleren','Verify expenses, privacy, receipts, export and settlement',60),
 ('agency.workflow','Agency','Klanten, leveranciers, taken, documenten, offertes en klantportaal controleren','Verify clients, suppliers, tasks, documents, quotes and client portal',70),
 ('agency.branding','Agency','Logo, branding per reis, publieke weergave en downgrade controleren','Verify logo, trip branding, public display and downgrade',80),
 ('notifications.all','Meldingen','Uitnodigingen, wijzigingen, toegang, feedback en platformmeldingen controleren','Verify invitations, changes, access, feedback and platform notices',90),
 ('public.website','Publiek','Homepage, demo, over-ons, status, juridische pagina’s en beide talen controleren','Verify homepage, demo, about, status, legal pages and both languages',100),
 ('backup.restore','Data','Reis- en accountexport plus herstel met echte testdata controleren','Verify trip and account exports and restore with real test data',110),
 ('providers.quotas','Providers','Providerstops en quota-reset per gebruiker en workspace controleren','Verify provider controls and quota reset per user and workspace',120),
 ('worker.runtime','Hosting','Web- en workercontainer, healthchecks, retries en logs op staging controleren','Verify web and worker containers, health checks, retries and logs on staging',130),
 ('security.final','Beveiliging','Finale deep securityscan uitvoeren en hoge bevindingen oplossen','Run final deep security scan and resolve high findings',140),
 ('production.rollback','Productie','Back-up, monitoring en rollbackprocedure praktisch oefenen','Practise backup, monitoring and rollback procedure',150)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;

CREATE OR REPLACE FUNCTION public.get_public_platform_status() RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('checkedAt',MAX(component.checked_at),'components',COALESCE(jsonb_agg(jsonb_build_object('key',component.component_key,'nameNl',component.name_nl,'nameEn',component.name_en,'status',component.status,'responseMs',component.response_ms,'checkedAt',component.checked_at) ORDER BY component.component_key),'[]'::JSONB)) FROM public.platform_status_components component;
$$;

ALTER TABLE public.platform_status_components ENABLE ROW LEVEL SECURITY;ALTER TABLE public.infrastructure_servers ENABLE ROW LEVEL SECURITY;ALTER TABLE public.release_checklist_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_status_components,public.infrastructure_servers,public.release_checklist_items FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_status_components,public.infrastructure_servers,public.release_checklist_items TO service_role;
REVOKE ALL ON FUNCTION public.get_public_platform_status() FROM PUBLIC,authenticated;GRANT EXECUTE ON FUNCTION public.get_public_platform_status() TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';COMMIT;
