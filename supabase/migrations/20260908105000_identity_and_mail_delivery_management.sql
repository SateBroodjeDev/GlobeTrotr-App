BEGIN;

ALTER TABLE public.email_outbox
  ADD COLUMN invitation_type TEXT CHECK (invitation_type IN ('trip','agency')),
  ADD COLUMN invitation_id UUID;
CREATE INDEX email_outbox_invitation_idx
  ON public.email_outbox(invitation_type,invitation_id,created_at DESC)
  WHERE invitation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_name TEXT;
BEGIN
  v_name := btrim(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'name',''),
    NULLIF(NEW.raw_user_meta_data->>'global_name',''),
    NULLIF(NEW.raw_user_meta_data->>'preferred_username',''),
    split_part(COALESCE(NEW.email,''),'@',1),
    'Reiziger'
  ));
  INSERT INTO public.profiles(id,display_name,email)
  VALUES(NEW.id,left(v_name,120),lower(NEW.email))
  ON CONFLICT(id) DO UPDATE SET
    display_name=COALESCE(NULLIF(public.profiles.display_name,''),EXCLUDED.display_name),
    email=EXCLUDED.email,
    updated_at=now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('auth.identity-management','Account','Google, Facebook en Discord koppelen en veilig ontkoppelen controleren','Verify linking and safely unlinking Google, Facebook and Discord',140),
('auth.oauth-profile-normalization','Account','Nieuwe OAuth-profielen op naam, e-mail en enkele workspace controleren','Verify new OAuth profiles for name, email and a single workspace',141),
('mail.delivery-management','Communicatie','Servicemailstatus bekijken en een mislukte verzending opnieuw aanbieden','View service email status and retry a failed delivery',142),
('mail.invitation-status','Communicatie','Bezorgstatus bij reis- en Agency-uitnodigingen controleren','Verify delivery status on trip and Agency invitations',143)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
