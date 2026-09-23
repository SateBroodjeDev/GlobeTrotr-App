BEGIN;
CREATE TABLE public.trip_booking_mail_addresses (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),trip_uuid UUID NOT NULL UNIQUE REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
 workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,mailbox_id UUID NOT NULL UNIQUE REFERENCES public.corporate_mailboxes(id) ON DELETE CASCADE,
 address TEXT NOT NULL UNIQUE CHECK(address ~ '^trip[.][a-z0-9]{12}@globetrotr[.]nl$'),allowed_senders TEXT[] NOT NULL DEFAULT '{}',
 retention_days SMALLINT NOT NULL DEFAULT 30 CHECK(retention_days BETWEEN 1 AND 365),active BOOLEAN NOT NULL DEFAULT true,
 created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,revoked_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.trip_booking_mail_drafts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),address_id UUID NOT NULL REFERENCES public.trip_booking_mail_addresses(id) ON DELETE CASCADE,
 trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,message_id UUID REFERENCES public.corporate_mail_messages(id) ON DELETE SET NULL,
 source_fingerprint TEXT NOT NULL CHECK(source_fingerprint ~ '^[a-f0-9]{64}$'),sender_address TEXT NOT NULL,subject TEXT NOT NULL DEFAULT '' CHECK(char_length(subject)<=500),
 booking_type TEXT NOT NULL CHECK(booking_type IN('flight','lodging','transport','car_rental','activity','unknown')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','rejected')),parsed_data JSONB NOT NULL DEFAULT '{}',
 confidence NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK(confidence BETWEEN 0 AND 1),source_expires_at TIMESTAMPTZ NOT NULL,
 reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,reviewed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(trip_uuid,source_fingerprint));
CREATE INDEX trip_booking_mail_pending_idx ON public.trip_booking_mail_drafts(trip_uuid,created_at DESC) WHERE status='pending';
ALTER TABLE public.trip_booking_mail_addresses ENABLE ROW LEVEL SECURITY;ALTER TABLE public.trip_booking_mail_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_booking_mail_addresses,public.trip_booking_mail_drafts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_booking_mail_addresses,public.trip_booking_mail_drafts TO service_role;
CREATE OR REPLACE FUNCTION public.cleanup_trip_booking_mail_drafts() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_count INTEGER;BEGIN
 DELETE FROM public.corporate_mail_messages WHERE id IN(SELECT message_id FROM public.trip_booking_mail_drafts WHERE source_expires_at<now() AND message_id IS NOT NULL);
 DELETE FROM public.trip_booking_mail_drafts WHERE source_expires_at<now();GET DIAGNOSTICS v_count=ROW_COUNT;RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.cleanup_trip_booking_mail_drafts() FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.cleanup_trip_booking_mail_drafts() TO service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES('trip.booking-mail','Reizen','Uniek trip-adres, afzenderfilter, dubbelherkenning, conceptcontrole, bevestiging en intrekking testen','Test unique trip address, sender filter, deduplication, draft review, confirmation and revocation',230)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
NOTIFY pgrst,'reload schema';COMMIT;
