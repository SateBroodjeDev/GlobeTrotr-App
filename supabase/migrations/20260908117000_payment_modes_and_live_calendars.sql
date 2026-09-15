-- Eenmalige maandtoegang, live agenda-feeds en acceptatiepunten.
BEGIN;

CREATE TABLE public.billing_entitlements(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workspace_uuid UUID NOT NULL REFERENCES public.workspaces(workspace_uuid) ON DELETE CASCADE,
 provider_transaction_id TEXT NOT NULL UNIQUE, plan TEXT NOT NULL CHECK(plan IN('pro','agency')),
 starts_at TIMESTAMPTZ NOT NULL DEFAULT now(), ends_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at)
);
ALTER TABLE public.billing_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_entitlements FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.billing_entitlements TO service_role;

CREATE TABLE public.trip_calendar_feeds(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), trip_uuid UUID NOT NULL REFERENCES public.trips(trip_uuid) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ
);
ALTER TABLE public.trip_calendar_feeds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_calendar_feeds FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.trip_calendar_feeds TO service_role;

CREATE OR REPLACE FUNCTION public.apply_paddle_one_time_purchase(p_event JSONB) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE d JSONB:=p_event->'data'; w UUID; p TEXT; e TIMESTAMPTZ; BEGIN
 IF p_event->>'event_type'<>'transaction.completed' OR d->>'globetrotr_billing_mode'<>'one_time' THEN RETURN 'ignored'; END IF;
 w:=NULLIF(d->'custom_data'->>'workspace_uuid','')::UUID; p:=d->>'globetrotr_plan';
 IF w IS NULL OR p NOT IN('pro','agency') OR NOT EXISTS(SELECT 1 FROM public.billing_webhook_events WHERE provider_event_id=p_event->>'event_id' AND status='processed') THEN RAISE EXCEPTION 'ONE_TIME_PURCHASE_INVALID'; END IF;
 SELECT GREATEST(now(),COALESCE(max(ends_at),now()))+interval '1 month' INTO e FROM public.billing_entitlements WHERE workspace_uuid=w AND plan=p AND ends_at>now();
 INSERT INTO public.billing_entitlements(workspace_uuid,provider_transaction_id,plan,ends_at) VALUES(w,d->>'id',p,e) ON CONFLICT(provider_transaction_id) DO NOTHING;
 UPDATE public.workspaces SET plan=CASE WHEN plan='agency' OR p='agency' THEN 'agency' ELSE p END,data=jsonb_set(COALESCE(data,'{}'::JSONB),'{plan}',to_jsonb(CASE WHEN plan='agency' OR p='agency' THEN 'agency' ELSE p END),true),updated_at=now() WHERE workspace_uuid=w;
 RETURN 'applied';
END $$;

CREATE OR REPLACE FUNCTION public.expire_billing_entitlements() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE n INTEGER; BEGIN
 WITH desired AS (
  SELECT e.workspace_uuid,CASE WHEN bool_or(e.plan='agency' AND e.ends_at>now()) THEN 'agency' WHEN bool_or(e.plan='pro' AND e.ends_at>now()) THEN 'pro' ELSE 'free' END plan
  FROM public.billing_entitlements e GROUP BY e.workspace_uuid
 ), changed AS (UPDATE public.workspaces w SET plan=d.plan,data=jsonb_set(COALESCE(data,'{}'::JSONB),'{plan}',to_jsonb(d.plan),true),updated_at=now() FROM desired d WHERE w.workspace_uuid=d.workspace_uuid AND w.plan<>d.plan
  AND NOT EXISTS(SELECT 1 FROM public.billing_customers c JOIN public.billing_subscriptions s ON s.customer_id=c.id WHERE c.workspace_uuid=w.workspace_uuid AND s.status IN('active','trialing','past_due')) RETURNING 1)
 SELECT count(*) INTO n FROM changed; RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.reconcile_paddle_one_time_purchase(p_event JSONB) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE d JSONB:=p_event->'data'; tx TEXT; BEGIN
 tx:=CASE WHEN p_event->>'event_type' LIKE 'adjustment.%' THEN d->>'transaction_id' ELSE d->>'id' END;
 IF tx IS NULL THEN RETURN 'ignored'; END IF;
 IF (p_event->>'event_type' LIKE 'adjustment.%' AND d->>'action'='refund' AND d->>'status'='approved')
 OR (p_event->>'event_type' LIKE 'transaction.%' AND COALESCE((d->'details'->'totals'->>'credit')::BIGINT,0)>=COALESCE((d->'details'->'totals'->>'total')::BIGINT,1)) THEN
  UPDATE public.billing_entitlements SET ends_at=LEAST(ends_at,now()) WHERE provider_transaction_id=tx;
  PERFORM public.expire_billing_entitlements(); RETURN 'revoked';
 END IF; RETURN 'unchanged';
END $$;

CREATE OR REPLACE FUNCTION public.get_trip_calendar_feed(p_token TEXT) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE t public.trips%ROWTYPE; BEGIN
 SELECT tr.* INTO t FROM public.trip_calendar_feeds f JOIN public.trips tr ON tr.trip_uuid=f.trip_uuid JOIN public.workspaces w ON w.user_id=tr.workspace_user_id
 WHERE f.active AND f.revoked_at IS NULL AND f.token_hash=encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex') AND w.plan IN('pro','agency');
 IF t.trip_uuid IS NULL THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('name',t.name,'start',t.start_date,'end',t.end_date,
  'itinerary',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'day',i.day,'title',i.title,'notes',i.notes) ORDER BY i.day,i.position) FROM public.trip_itinerary_items i WHERE i.trip_uuid=t.trip_uuid),'[]'::JSONB),
  'bookings',COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.start_date,b.created_at) FROM public.trip_travel_items b WHERE b.trip_uuid=t.trip_uuid),'[]'::JSONB));
END $$;

REVOKE ALL ON FUNCTION public.apply_paddle_one_time_purchase(JSONB),public.reconcile_paddle_one_time_purchase(JSONB),public.expire_billing_entitlements(),public.get_trip_calendar_feed(TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_one_time_purchase(JSONB),public.reconcile_paddle_one_time_purchase(JSONB),public.expire_billing_entitlements(),public.get_trip_calendar_feed(TEXT) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('billing.one-time-month','Betaling en recht','Eenmalige maand Pro en Agency met iDEAL, einddatum en automatische afloop controleren','Verify one-time Pro and Agency month with iDEAL, end date and automatic expiry',227),
('auth.discord-linking','Account','Discord aan een bestaand account koppelen en na terugkeer zichtbaar zien','Link Discord to an existing account and verify it is visible after returning',228),
('trip.calendar-feed','Reizen','Intrekbare Pro-agendafeed toevoegen, abonneren en verversen controleren','Verify creating, subscribing to, refreshing and revoking a Pro calendar feed',229),
('trip.gpx-download','Reizen','GPX met geldige routepunten downloaden en openen controleren','Verify downloading and opening GPX with valid route points',230),
('corporate.mailbox-create','Corporate Admin','Nieuw bedrijfspostvak met IMAP-gegevens toevoegen en synchroniseren controleren','Verify adding and syncing a company mailbox with IMAP details',231),
('auth.registration-turnstile','Account','Nieuw account met Turnstile registreren en bevestigingsmail controleren','Register a new account with Turnstile and verify the confirmation email',232)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
