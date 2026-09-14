BEGIN;
CREATE OR REPLACE FUNCTION public.set_email_delivery_mode(p_mode TEXT,p_release_held BOOLEAN,p_actor UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_changed INTEGER:=0;
BEGIN
 IF p_mode NOT IN('test','live') THEN RAISE EXCEPTION 'INVALID_MAIL_DELIVERY_MODE'; END IF;
 UPDATE public.email_delivery_config SET mode=p_mode,updated_at=now(),updated_by=p_actor WHERE id=true;
 IF p_mode='live' AND p_release_held THEN
   UPDATE public.email_outbox SET status='pending',available_at=now(),updated_at=now() WHERE status='held';
   GET DIAGNOSTICS v_changed=ROW_COUNT;
 ELSIF p_mode='test' THEN
   UPDATE public.email_outbox SET status='held',updated_at=now() WHERE status='pending';
   GET DIAGNOSTICS v_changed=ROW_COUNT;
 END IF;
 RETURN jsonb_build_object('mode',p_mode,'changed',v_changed);
END $$;
REVOKE ALL ON FUNCTION public.set_email_delivery_mode(TEXT,BOOLEAN,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_delivery_mode(TEXT,BOOLEAN,UUID) TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('mail.delivery-mode','Communicatie','Servicemail gecontroleerd pauzeren, hervatten en vastgehouden berichten vrijgeven','Safely pause and resume service email and release held messages',144)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
