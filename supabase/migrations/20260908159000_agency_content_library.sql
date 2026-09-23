BEGIN;
CREATE TABLE public.agency_content_library(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 title TEXT NOT NULL CHECK(char_length(title) BETWEEN 1 AND 120),content_type TEXT NOT NULL CHECK(content_type IN('destination','accommodation','activity','day_block','text','media')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','published')),visibility TEXT NOT NULL DEFAULT 'organization' CHECK(visibility IN('organization','personal')),
 locale TEXT NOT NULL DEFAULT 'nl' CHECK(locale IN('nl','en')),tags TEXT[] NOT NULL DEFAULT '{}',content JSONB NOT NULL DEFAULT '{}',
 source_url TEXT CHECK(source_url IS NULL OR char_length(source_url)<=1000),license_label TEXT CHECK(license_label IS NULL OR char_length(license_label)<=200),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 reviewed_at TIMESTAMPTZ,archived_at TIMESTAMPTZ,created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX agency_content_library_workspace_idx ON public.agency_content_library(workspace_uuid,content_type,status,updated_at DESC) WHERE archived_at IS NULL;
CREATE TABLE public.agency_content_library_versions(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),item_id UUID NOT NULL REFERENCES public.agency_content_library(id) ON DELETE CASCADE,
 version INTEGER NOT NULL,title TEXT NOT NULL,content_type TEXT NOT NULL,status TEXT NOT NULL,visibility TEXT NOT NULL,locale TEXT NOT NULL,tags TEXT[] NOT NULL,content JSONB NOT NULL,
 source_url TEXT,license_label TEXT,changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(item_id,version));
CREATE OR REPLACE FUNCTION private.validate_agency_content_library() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF jsonb_typeof(NEW.content)<>'object' OR length(NEW.content::text)>30000 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='CONTENT_LIBRARY_PAYLOAD_INVALID';END IF;
 IF cardinality(NEW.tags)>20 OR EXISTS(SELECT 1 FROM unnest(NEW.tags)t WHERE char_length(t)>40 OR btrim(t)='')THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='CONTENT_LIBRARY_TAGS_INVALID';END IF;
 IF NEW.source_url IS NOT NULL AND NEW.source_url!~'^https://' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='CONTENT_LIBRARY_SOURCE_INVALID';END IF;
 IF TG_OP='UPDATE' THEN NEW.version:=OLD.version+1;END IF;NEW.updated_at:=now();RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION private.version_agency_content_library() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN INSERT INTO public.agency_content_library_versions(item_id,version,title,content_type,status,visibility,locale,tags,content,source_url,license_label,changed_by)
 VALUES(NEW.id,NEW.version,NEW.title,NEW.content_type,NEW.status,NEW.visibility,NEW.locale,NEW.tags,NEW.content,NEW.source_url,NEW.license_label,NEW.updated_by);RETURN NEW;END $$;
CREATE TRIGGER validate_agency_content_library BEFORE INSERT OR UPDATE ON public.agency_content_library FOR EACH ROW EXECUTE FUNCTION private.validate_agency_content_library();
CREATE TRIGGER version_agency_content_library AFTER INSERT OR UPDATE ON public.agency_content_library FOR EACH ROW EXECUTE FUNCTION private.version_agency_content_library();
ALTER TABLE public.agency_content_library ENABLE ROW LEVEL SECURITY;ALTER TABLE public.agency_content_library_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_content_library,public.agency_content_library_versions FROM PUBLIC,anon,authenticated;GRANT ALL ON public.agency_content_library,public.agency_content_library_versions TO service_role;
REVOKE ALL ON FUNCTION private.validate_agency_content_library(),private.version_agency_content_library() FROM PUBLIC,anon,authenticated;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)VALUES('agency.content-library','Agency','Contentbibliotheek met typen, persoonlijke concepten, publicatie, tags, taal, versies, bron, licentie, archief en tenantisolatie testen','Test content library types, personal drafts, publishing, tags, language, versions, source, licence, archive and tenant isolation',240)
ON CONFLICT(item_key)DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';COMMIT;
