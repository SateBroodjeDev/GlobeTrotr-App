-- Paddle wordt de gezaghebbende bron voor betaalde abonnementen.
-- Uitvoeren na 20260908115000_mailbox_credentials_and_agency_domains.sql.
BEGIN;

ALTER TABLE public.billing_webhook_events
  ADD COLUMN IF NOT EXISTS notification_id TEXT;

UPDATE public.known_issues SET status='resolved',public=false,updated_at=now()
WHERE id='5c854f0a-8814-4f0c-9cb6-3cdfa5fce104'::UUID;

CREATE OR REPLACE FUNCTION public.process_paddle_billing_event(p_event JSONB)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
  v_event_id TEXT := p_event->>'event_id';
  v_type TEXT := p_event->>'event_type';
  v_data JSONB := p_event->'data';
  v_workspace UUID;
  v_customer public.billing_customers%ROWTYPE;
  v_subscription public.billing_subscriptions%ROWTYPE;
  v_plan TEXT;
  v_status TEXT;
  v_interval TEXT;
BEGIN
  IF v_event_id IS NULL OR v_type IS NULL OR jsonb_typeof(v_data) <> 'object' THEN
    RAISE EXCEPTION 'PADDLE_EVENT_INVALID';
  END IF;

  INSERT INTO public.billing_webhook_events(
    provider_event_id,event_type,occurred_at,payload,status,notification_id
  ) VALUES (
    v_event_id,v_type,COALESCE((p_event->>'occurred_at')::TIMESTAMPTZ,now()),p_event,
    'processing',p_event->>'notification_id'
  ) ON CONFLICT(provider,provider_event_id) DO NOTHING;

  IF NOT FOUND THEN
    IF EXISTS(SELECT 1 FROM public.billing_webhook_events WHERE provider='paddle'
      AND provider_event_id=v_event_id AND status='failed' AND attempts<10) THEN
      UPDATE public.billing_webhook_events SET status='processing',attempts=attempts+1,
        last_error_code=NULL WHERE provider='paddle' AND provider_event_id=v_event_id;
    ELSE
      RETURN 'duplicate';
    END IF;
  END IF;

  BEGIN

  BEGIN
    v_workspace := NULLIF(COALESCE(
      v_data->'custom_data'->>'workspace_uuid',
      v_data->'custom_data'->>'workspaceUuid'
    ),'')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_workspace := NULL;
  END;

  IF v_workspace IS NULL AND v_data->>'customer_id' IS NOT NULL THEN
    SELECT * INTO v_customer FROM public.billing_customers
      WHERE provider='paddle' AND provider_customer_id=v_data->>'customer_id';
    v_workspace := v_customer.workspace_uuid;
  END IF;
  IF v_workspace IS NULL AND v_type LIKE 'customer.%' AND v_data->>'id' IS NOT NULL THEN
    SELECT * INTO v_customer FROM public.billing_customers
      WHERE provider='paddle' AND provider_customer_id=v_data->>'id';
    v_workspace := v_customer.workspace_uuid;
  END IF;
  IF v_workspace IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.workspaces WHERE workspace_uuid=v_workspace
  ) THEN
    UPDATE public.billing_webhook_events SET status='ignored',processed_at=now(),
      last_error_code='WORKSPACE_NOT_FOUND' WHERE provider_event_id=v_event_id;
    RETURN 'ignored';
  END IF;

  IF v_data->>'customer_id' IS NOT NULL OR (v_type LIKE 'customer.%' AND v_data->>'id' IS NOT NULL) THEN
    INSERT INTO public.billing_customers(workspace_uuid,provider_customer_id,billing_email,updated_at)
    VALUES(v_workspace,COALESCE(v_data->>'customer_id',v_data->>'id'),
      COALESCE(v_data->>'email',(SELECT u.email FROM public.workspaces w JOIN auth.users u ON u.id=w.user_id WHERE w.workspace_uuid=v_workspace)),now())
    ON CONFLICT(workspace_uuid) DO UPDATE SET
      provider_customer_id=EXCLUDED.provider_customer_id,
      billing_email=COALESCE(EXCLUDED.billing_email,public.billing_customers.billing_email),
      updated_at=now()
    RETURNING * INTO v_customer;
  ELSE
    SELECT * INTO v_customer FROM public.billing_customers WHERE workspace_uuid=v_workspace;
  END IF;

  IF v_type LIKE 'subscription.%' THEN
    -- Dit veld wordt pas na signaturecontrole door onze worker uit de toegestane
    -- price-ID afgeleid. Custom data uit de browser bepaalt nooit het plan.
    v_plan := lower(COALESCE(v_data->>'globetrotr_plan',''));
    IF v_plan NOT IN ('pro','agency') THEN RAISE EXCEPTION 'PADDLE_PLAN_INVALID'; END IF;
    v_status := CASE v_data->>'status' WHEN 'canceled' THEN 'cancelled' ELSE v_data->>'status' END;
    IF v_status NOT IN ('trialing','active','past_due','paused','cancelled') THEN
      RAISE EXCEPTION 'PADDLE_STATUS_INVALID';
    END IF;
    v_interval := COALESCE(v_data->'billing_cycle'->>'interval','month');
    IF v_interval NOT IN ('month','year') THEN v_interval := 'month'; END IF;
    INSERT INTO public.billing_subscriptions(
      customer_id,provider_subscription_id,plan,status,currency,recurring_total_minor,
      billing_interval,current_period_start,current_period_end,scheduled_change,cancelled_at,updated_at
    ) VALUES (
      v_customer.id,v_data->>'id',v_plan,v_status,upper(COALESCE(v_data->>'currency_code','EUR')),
      GREATEST(COALESCE((v_data->'recurring_transaction_details'->'totals'->>'total')::BIGINT,0),0),
      v_interval,(v_data->'current_billing_period'->>'starts_at')::TIMESTAMPTZ,
      (v_data->'current_billing_period'->>'ends_at')::TIMESTAMPTZ,
      CASE v_data->'scheduled_change'->>'action' WHEN 'cancel' THEN 'cancel'
        WHEN 'pause' THEN 'pause' WHEN 'resume' THEN NULL ELSE NULL END,
      (v_data->>'canceled_at')::TIMESTAMPTZ,now()
    ) ON CONFLICT(provider_subscription_id) DO UPDATE SET
      plan=EXCLUDED.plan,status=EXCLUDED.status,currency=EXCLUDED.currency,
      recurring_total_minor=EXCLUDED.recurring_total_minor,billing_interval=EXCLUDED.billing_interval,
      current_period_start=EXCLUDED.current_period_start,current_period_end=EXCLUDED.current_period_end,
      scheduled_change=EXCLUDED.scheduled_change,cancelled_at=EXCLUDED.cancelled_at,updated_at=now()
    RETURNING * INTO v_subscription;

    UPDATE public.workspaces SET
      plan=CASE WHEN v_status IN('active','trialing','past_due') THEN v_plan ELSE 'free' END,
      data=jsonb_set(COALESCE(data,'{}'::JSONB),'{plan}',
        to_jsonb(CASE WHEN v_status IN('active','trialing','past_due') THEN v_plan ELSE 'free' END),true),
      updated_at=now()
    WHERE workspace_uuid=v_workspace;

    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    SELECT w.user_id,'account',
      CASE v_status
        WHEN 'past_due' THEN 'Betaling mislukt / Payment failed'
        WHEN 'paused' THEN 'Abonnement gepauzeerd / Subscription paused'
        WHEN 'cancelled' THEN 'Abonnement beëindigd / Subscription ended'
        ELSE 'Abonnement bijgewerkt / Subscription updated' END,
      CASE v_status
        WHEN 'past_due' THEN 'Paddle probeert de betaling opnieuw. Controleer je betaalmethode via Abonnement beheren. / Paddle will retry the payment. Check your payment method through Manage subscription.'
        WHEN 'paused' THEN 'Je betaalde functies zijn gepauzeerd. / Your paid features have been paused.'
        WHEN 'cancelled' THEN 'Je abonnement is beëindigd en de workspace gebruikt nu Free. / Your subscription has ended and the workspace now uses Free.'
        ELSE 'Je abonnement op '||upper(v_plan)||' is bijgewerkt. / Your '||upper(v_plan)||' subscription has been updated.' END,
      'paddle-subscription:'||v_event_id
    FROM public.workspaces w WHERE w.workspace_uuid=v_workspace
    ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
      created_at=now(),dismissed_at=NULL;
    UPDATE public.email_outbox o SET template_key='billing',
      payload=o.payload||jsonb_build_object('actionUrl','https://globetrotr.nl/billing'),updated_at=now()
    FROM public.notifications n WHERE o.notification_id=n.id
      AND n.event_key='paddle-subscription:'||v_event_id;
  ELSIF v_type LIKE 'transaction.%' THEN
    IF v_customer.id IS NULL THEN RAISE EXCEPTION 'PADDLE_CUSTOMER_MISSING'; END IF;
    SELECT * INTO v_subscription FROM public.billing_subscriptions
      WHERE provider_subscription_id=v_data->>'subscription_id';
    INSERT INTO public.billing_transactions(
      customer_id,subscription_id,provider_transaction_id,status,currency,
      subtotal_minor,tax_minor,total_minor,refunded_minor,occurred_at,updated_at
    ) VALUES (
      v_customer.id,v_subscription.id,v_data->>'id',
      CASE
        WHEN COALESCE((v_data->'details'->'totals'->>'credit')::BIGINT,0) >= COALESCE((v_data->'details'->'totals'->>'total')::BIGINT,1) THEN 'refunded'
        WHEN COALESCE((v_data->'details'->'totals'->>'credit')::BIGINT,0) > 0 THEN 'partially_refunded'
        WHEN v_type='transaction.payment_failed' THEN 'past_due'
        WHEN v_data->>'status' IN('ready','billed','paid','completed','past_due','canceled') THEN replace(v_data->>'status','canceled','cancelled')
        ELSE 'ready' END,
      upper(COALESCE(v_data->>'currency_code','EUR')),
      GREATEST(COALESCE((v_data->'details'->'totals'->>'subtotal')::BIGINT,0),0),
      GREATEST(COALESCE((v_data->'details'->'totals'->>'tax')::BIGINT,0),0),
      GREATEST(COALESCE((v_data->'details'->'totals'->>'total')::BIGINT,0),0),
      LEAST(
        GREATEST(COALESCE((v_data->'details'->'totals'->>'total')::BIGINT,0),0),
        GREATEST(COALESCE((v_data->'details'->'totals'->>'credit')::BIGINT,0),0)
      ),
      COALESCE((v_data->>'billed_at')::TIMESTAMPTZ,(p_event->>'occurred_at')::TIMESTAMPTZ,now()),now()
    ) ON CONFLICT(provider_transaction_id) DO UPDATE SET
      status=EXCLUDED.status,subscription_id=EXCLUDED.subscription_id,
      subtotal_minor=EXCLUDED.subtotal_minor,tax_minor=EXCLUDED.tax_minor,
      total_minor=EXCLUDED.total_minor,refunded_minor=EXCLUDED.refunded_minor,updated_at=now();

    IF v_type='transaction.completed' THEN
      INSERT INTO public.corporate_invoices(
        external_provider,external_id,invoice_number,workspace_uuid,customer_name,
        customer_email,currency,subtotal_minor,tax_minor,total_minor,status,issued_at,paid_at,hosted_url,updated_at
      ) VALUES(
        'paddle',v_data->>'id',COALESCE(NULLIF(v_data->>'invoice_number',''),v_data->>'id'),
        v_workspace,COALESCE(NULLIF(v_customer.billing_email,''),'Paddle-klant'),v_customer.billing_email,
        upper(COALESCE(v_data->>'currency_code','EUR')),
        GREATEST(COALESCE((v_data->'details'->'totals'->>'subtotal')::BIGINT,0),0),
        GREATEST(COALESCE((v_data->'details'->'totals'->>'tax')::BIGINT,0),0),
        GREATEST(COALESCE((v_data->'details'->'totals'->>'total')::BIGINT,0),0),
        'paid',COALESCE((v_data->>'billed_at')::TIMESTAMPTZ,now()),
        COALESCE((v_data->>'billed_at')::TIMESTAMPTZ,now()),v_data->>'globetrotr_invoice_url',now()
      ) ON CONFLICT(external_provider,external_id) DO UPDATE SET
        status='paid',hosted_url=COALESCE(EXCLUDED.hosted_url,public.corporate_invoices.hosted_url),updated_at=now();
      UPDATE public.billing_transactions t SET invoice_id=i.id
      FROM public.corporate_invoices i WHERE t.provider_transaction_id=v_data->>'id'
        AND i.external_provider='paddle' AND i.external_id=v_data->>'id';
    END IF;

    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    SELECT w.user_id,'account',
      CASE WHEN v_type='transaction.payment_failed' OR v_data->>'status'='past_due'
        THEN 'Betaling mislukt / Payment failed'
        WHEN COALESCE((v_data->'details'->'totals'->>'credit')::BIGINT,0)>0
        THEN 'Terugbetaling verwerkt / Refund processed'
        ELSE 'Betaling ontvangen / Payment received' END,
      CASE WHEN v_type='transaction.payment_failed' OR v_data->>'status'='past_due'
        THEN 'Werk je betaalmethode bij via Abonnement beheren. Paddle probeert de betaling volgens het herstelbeleid opnieuw. / Update your payment method through Manage subscription. Paddle will retry according to the recovery policy.'
        WHEN COALESCE((v_data->'details'->'totals'->>'credit')::BIGINT,0)>0
        THEN 'Paddle heeft een terugbetaling verwerkt. De verwerkingstijd bij je bank kan verschillen. / Paddle has processed a refund. Your bank processing time may vary.'
        ELSE 'Paddle heeft je betaling ontvangen. Je officiële betalingsbewijs en factuur zijn beschikbaar via Abonnement beheren. / Paddle has received your payment. Your official receipt and invoice are available through Manage subscription.' END,
      'paddle-transaction:'||v_event_id
    FROM public.workspaces w WHERE w.workspace_uuid=v_workspace
    ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
      created_at=now(),dismissed_at=NULL;
    UPDATE public.email_outbox o SET template_key='billing',
      payload=o.payload||jsonb_build_object('actionUrl','https://globetrotr.nl/billing'),updated_at=now()
    FROM public.notifications n WHERE o.notification_id=n.id
      AND n.event_key='paddle-transaction:'||v_event_id;
  ELSIF v_type LIKE 'adjustment.%' AND v_data->>'action'='refund' THEN
    IF v_data->>'status'='approved' THEN
      UPDATE public.billing_transactions SET
        refunded_minor=LEAST(total_minor,GREATEST(refunded_minor,
          COALESCE((v_data->'totals'->>'grand_total')::BIGINT,total_minor))),
        status=CASE WHEN COALESCE((v_data->'totals'->>'grand_total')::BIGINT,total_minor)>=total_minor
          THEN 'refunded' ELSE 'partially_refunded' END,
        updated_at=now()
      WHERE provider_transaction_id=v_data->>'transaction_id';
      UPDATE public.corporate_invoices SET status='refunded',updated_at=now()
        WHERE external_provider='paddle' AND external_id=v_data->>'transaction_id';
    END IF;
    INSERT INTO public.notifications(user_id,kind,title,body,event_key)
    SELECT w.user_id,'account','Terugbetaling bijgewerkt / Refund updated',
      CASE v_data->>'status'
        WHEN 'approved' THEN 'Paddle heeft de terugbetaling goedgekeurd en stuurt een creditnota. / Paddle approved the refund and will send a credit note.'
        WHEN 'rejected' THEN 'Paddle heeft de terugbetaling niet goedgekeurd. Neem contact op met support voor uitleg. / Paddle did not approve the refund. Contact support for details.'
        ELSE 'Je terugbetaling wacht op beoordeling door Paddle. / Your refund is awaiting review by Paddle.' END,
      'paddle-adjustment:'||v_event_id
    FROM public.workspaces w WHERE w.workspace_uuid=v_workspace
    ON CONFLICT(user_id,event_key) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,
      created_at=now(),dismissed_at=NULL;
    UPDATE public.email_outbox o SET template_key='billing',
      payload=o.payload||jsonb_build_object('actionUrl','https://globetrotr.nl/billing'),updated_at=now()
    FROM public.notifications n WHERE o.notification_id=n.id
      AND n.event_key='paddle-adjustment:'||v_event_id;
  END IF;

  UPDATE public.billing_webhook_events SET status='processed',processed_at=now(),last_error_code=NULL
    WHERE provider_event_id=v_event_id;
  RETURN 'processed';
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.billing_webhook_events SET status='failed',processed_at=now(),
      last_error_code=left(SQLSTATE||':'||SQLERRM,160) WHERE provider_event_id=v_event_id;
    RETURN 'failed';
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.process_paddle_billing_event(JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_paddle_billing_event(JSONB) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES
('billing.paddle-checkout','Betaling en recht','Paddle Sandbox-checkout voor Pro en Agency controleren','Verify Paddle Sandbox checkout for Pro and Agency',221),
('billing.paddle-webhooks','Betaling en recht','Webhookhandtekening, duplicaten en abonnementsrechten controleren','Verify webhook signature, duplicates and subscription entitlements',222),
('billing.paddle-portal','Betaling en recht','Customer Portal, opzegging en facturen controleren','Verify Customer Portal, cancellation and invoices',223),
('billing.transactional-email','Betaling en recht','NL/EN betaalmails, Paddle-factuur en creditnota controleren','Verify NL/EN billing emails, Paddle invoice and credit note',224),
('billing.refunds','Betaling en recht','Volledige terugbetaling en reconciliatie vanuit Corporate Admin controleren','Verify full refund and reconciliation from Corporate Admin',225),
('billing.plan-change','Betaling en recht','Pro- en Agency-planwijziging met verrekening controleren','Verify Pro and Agency plan changes with proration',226)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,
  label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
