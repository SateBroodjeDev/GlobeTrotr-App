BEGIN;

-- Keep the plain-text alternative for accessibility, but retain the original
-- HTML part for sandboxed display in Corporate Mail.
ALTER TABLE public.corporate_mail_messages
  ADD COLUMN IF NOT EXISTS body_html TEXT
  CHECK (body_html IS NULL OR char_length(body_html) <= 100000);

ALTER TABLE public.corporate_mail_send_queue
  ADD COLUMN IF NOT EXISTS body_html TEXT
  CHECK (body_html IS NULL OR char_length(body_html) <= 100000);

-- Direct trip/agency invitation emails include the actual acceptance link.
-- Their corresponding in-app notification must not create a second email.
CREATE OR REPLACE FUNCTION private.queue_notification_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email TEXT; v_locale TEXT; v_mode TEXT; v_preferences JSONB; v_preference_key TEXT;
BEGIN
  IF NEW.dismissed_at IS NOT NULL THEN
    UPDATE public.email_outbox SET status='cancelled',updated_at=now()
      WHERE notification_id=NEW.id AND status IN('held','pending','failed');
    RETURN NEW;
  END IF;
  IF NEW.kind NOT IN('invitation','trip_access','agency_access','trip_settlement','platform','account') THEN RETURN NEW; END IF;
  IF NEW.kind='invitation' THEN RETURN NEW; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id=NEW.user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN NEW; END IF;
  SELECT CASE WHEN lower(COALESCE(locale,'')) LIKE 'en%' THEN 'en' ELSE 'nl' END,
    COALESCE(notification_preferences,'{}'::JSONB)
    INTO v_locale,v_preferences FROM public.profiles WHERE id=NEW.user_id;
  v_locale:=COALESCE(v_locale,'nl');
  v_preference_key:=CASE WHEN NEW.kind IN('trip_access','agency_access') THEN 'invitations'
    WHEN NEW.kind='trip_settlement' THEN 'payments' ELSE NULL END;
  IF v_preference_key IS NOT NULL AND COALESCE((v_preferences->>v_preference_key)::BOOLEAN,true)=false THEN RETURN NEW; END IF;
  SELECT mode INTO v_mode FROM public.email_delivery_config WHERE id=true;
  INSERT INTO public.email_outbox(notification_id,user_id,recipient_email,locale,template_key,payload,status)
  VALUES(NEW.id,NEW.user_id,lower(v_email),v_locale,NEW.kind,
    jsonb_build_object('title',left(NEW.title,160),'body',left(NEW.body,1000),'tripId',NEW.trip_uuid),
    CASE WHEN v_mode='live' THEN 'pending' ELSE 'held' END)
  ON CONFLICT(notification_id) DO UPDATE SET payload=EXCLUDED.payload,locale=EXCLUDED.locale,
    updated_at=now(),status=CASE WHEN email_outbox.status IN('sent','processing')
      THEN email_outbox.status ELSE EXCLUDED.status END;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.queue_notification_email() FROM PUBLIC,anon,authenticated;

-- Idempotent one-time entitlement: a retry must neither extend access twice
-- nor lose a paid entitlement after the webhook event was committed.
CREATE OR REPLACE FUNCTION public.apply_paddle_one_time_purchase(p_event JSONB) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE d JSONB:=p_event->'data'; w UUID; p TEXT; e TIMESTAMPTZ; BEGIN
 IF p_event->>'event_type'<>'transaction.completed' OR d->>'globetrotr_billing_mode'<>'one_time' THEN RETURN 'ignored'; END IF;
 w:=NULLIF(d->'custom_data'->>'workspace_uuid','')::UUID; p:=d->>'globetrotr_plan';
 IF w IS NULL OR p NOT IN('pro','agency') OR NOT EXISTS(SELECT 1 FROM public.billing_webhook_events
   WHERE provider='paddle' AND provider_event_id=p_event->>'event_id' AND status='processed') THEN
   RAISE EXCEPTION 'ONE_TIME_PURCHASE_INVALID'; END IF;
 IF EXISTS(SELECT 1 FROM public.billing_entitlements WHERE provider_transaction_id=d->>'id') THEN RETURN 'duplicate'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(w::TEXT));
 SELECT GREATEST(now(),COALESCE(max(ends_at),now()))+interval '1 month' INTO e
   FROM public.billing_entitlements WHERE workspace_uuid=w AND plan=p AND ends_at>now();
 INSERT INTO public.billing_entitlements(workspace_uuid,provider_transaction_id,plan,ends_at)
   VALUES(w,d->>'id',p,e) ON CONFLICT(provider_transaction_id) DO NOTHING;
 UPDATE public.workspaces SET plan=CASE WHEN plan='agency' OR p='agency' THEN 'agency' ELSE p END,
   data=jsonb_set(COALESCE(data,'{}'::JSONB),'{plan}',
     to_jsonb(CASE WHEN plan='agency' OR p='agency' THEN 'agency' ELSE p END),true),updated_at=now()
   WHERE workspace_uuid=w;
 RETURN 'applied';
END $$;
REVOKE ALL ON FUNCTION public.apply_paddle_one_time_purchase(JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_one_time_purchase(JSONB) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('beta.mail-invites','Communicatie','Reisuitnodiging: één opgemaakte mail met werkende link en in-app melding','Trip invitation: one branded email with working link and in-app notification',151),
('beta.mail-format','Communicatie','Planwijziging en storing: opgemaakte mail in NL/EN; bedrijfsmail met HTML en platte-tekstalternatief','Plan change and incident: branded email in NL/EN; corporate mail with HTML and text alternative',152),
('beta.staff-save','Bedrijf','Bedrijfsbeheerder aanmaken, aanpassen en opnieuw inloggen','Create and edit corporate staff and sign in again',153),
('beta.agency-link','Agency','Agency-klant koppelen en met diens account dashboard openen','Link agency client and open dashboard with client account',154),
('beta.gpx-ics','Reis','GPX downloaden, activiteiten in ICS importeren en live agendalink openen','Download GPX, import activities from ICS and open live calendar link',155),
('beta.paddle-entitlement','Betaling','Eenmalige en terugkerende Paddle-betaling activeren ook na webhookherhaling','One-time and recurring Paddle payments activate after webhook retry',156),
('beta.corporate-html','Bedrijf','Uitgaande HTML-mail en inkomende HTML-mail veilig weergeven','Send HTML corporate mail and safely display inbound HTML',157),
('beta.mail-language','Communicatie','Engelstalige standaardmail en expliciete Nederlandse voorkeur controleren','Verify English default email and explicit Dutch preference',158),
('beta.public-schedule','Publiek','Openbare reispagina toont planning en gedeelde boekingen samen per dag','Public trip page groups itinerary and shared bookings by day',159),
('beta.expense-payer','Reis','Uitgavenformulier: lange namen in Betaald door passen op telefoon','Expense form: long payer names fit on mobile',160),
('beta.linux-build','Techniek','Productie-images bouwen op Node-01 en Node-02 en alle healthchecks controleren','Build production images on Node-01 and Node-02 and verify every health check',161),
('beta.typecheck','Techniek','Volledige TypeScript-controle zonder fouten uitvoeren','Run the complete TypeScript check without errors',162),
('beta.public-smoke','Techniek','Productiesmoketest voor publieke routes, registratie, status en merkbestanden uitvoeren','Run production smoke test for public routes, registration, status and brand assets',163),
('beta.contact-security','Beveiliging','Contactformulier accepteert alleen een geldig Turnstile-token voor de contactactie en faalt begrensd','Contact form accepts only a valid Turnstile token for the contact action and fails within a bounded time',164),
('beta.redirect-security','Beveiliging','Inloggen accepteert uitsluitend een genormaliseerd intern terugkeerpad','Sign-in accepts only a normalised internal return path',165),
('beta.serverfn-security','Beveiliging','Statische audit op onbeoordeelde service-role-serverfuncties uitvoeren','Run static audit for unreviewed service-role server functions',166),
('beta.corporate-editor','Bedrijf','Bedrijfsmail opmaken met vet, cursief, lijsten en veilige links; controleer ook de platte-tekstvariant','Format corporate mail with bold, italic, lists and safe links; also verify the plain-text alternative',167)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
