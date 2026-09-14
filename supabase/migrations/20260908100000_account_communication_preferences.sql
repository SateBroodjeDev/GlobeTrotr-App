BEGIN;

-- Accountbrede e-mailkeuzes worden al provider-onafhankelijk in profiles JSONB
-- opgeslagen. Deze versie laat de outbox de relevante keuzes respecteren.
CREATE OR REPLACE FUNCTION private.queue_notification_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email TEXT;v_locale TEXT;v_mode TEXT;v_preferences JSONB;v_preference_key TEXT;
BEGIN
  IF NEW.dismissed_at IS NOT NULL THEN
    UPDATE public.email_outbox SET status='cancelled',updated_at=now()
    WHERE notification_id=NEW.id AND status IN('held','pending','failed');
    RETURN NEW;
  END IF;
  IF NEW.kind NOT IN('invitation','trip_access','agency_access','trip_settlement','platform','account') THEN RETURN NEW;END IF;
  SELECT email INTO v_email FROM auth.users WHERE id=NEW.user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN NEW;END IF;
  SELECT CASE WHEN lower(COALESCE(locale,'')) LIKE 'en%' THEN 'en' ELSE 'nl' END,
         COALESCE(notification_preferences,'{}'::JSONB)
  INTO v_locale,v_preferences FROM public.profiles WHERE id=NEW.user_id;
  v_locale:=COALESCE(v_locale,'nl');
  v_preference_key:=CASE
    WHEN NEW.kind IN('invitation','trip_access','agency_access') THEN 'invitations'
    WHEN NEW.kind='trip_settlement' THEN 'payments'
    ELSE NULL
  END;
  IF v_preference_key IS NOT NULL AND COALESCE((v_preferences->>v_preference_key)::BOOLEAN,true)=false THEN RETURN NEW;END IF;
  SELECT mode INTO v_mode FROM public.email_delivery_config WHERE id=true;
  INSERT INTO public.email_outbox(notification_id,user_id,recipient_email,locale,template_key,payload,status)
  VALUES(NEW.id,NEW.user_id,lower(v_email),v_locale,NEW.kind,jsonb_build_object('title',left(NEW.title,160),'body',left(NEW.body,1000),'tripId',NEW.trip_uuid),CASE WHEN v_mode='live' THEN 'pending' ELSE 'held' END)
  ON CONFLICT(notification_id) DO UPDATE SET payload=EXCLUDED.payload,locale=EXCLUDED.locale,updated_at=now(),status=CASE WHEN email_outbox.status IN('sent','processing') THEN email_outbox.status ELSE EXCLUDED.status END;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.queue_notification_email() FROM PUBLIC,anon,authenticated;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('auth.production-email','Account','Registratie- en bevestigingsmail via productie-SMTP en GlobeTrotr-tokenroute controleren','Verify signup and confirmation email through production SMTP and the GlobeTrotr token route',121),
('auth.passkeys','Account','Passkey toevoegen, ermee inloggen en verwijderen controleren','Verify adding, using and deleting a passkey',122),
('account.communication','Account','Accountbrede e-mailvoorkeuren en verplichte beveiligingsmail controleren','Verify account-wide email preferences and mandatory security email',123),
('public.trip-layout','Publiek','Openbare reis met acht bestemmingen en compacte reisonderdelen controleren','Verify a public trip with eight destinations and compact travel bookings',124),
('deployment.brand-assets','Infrastructuur','Logo in header en openbaar e-maillogo vanaf eigen domein controleren','Verify the header logo and public email logo from the first-party domain',125)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
