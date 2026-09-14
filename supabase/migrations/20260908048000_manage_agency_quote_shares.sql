-- Laat bevoegde Agency-medewerkers een offertelink direct intrekken.
-- Een nieuwe link via prepare_agency_quote_share roteert het bestaande token.
-- Uitvoeren na 20260908047000_convert_agency_quotes.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.revoke_agency_quote_share(
  p_workspace_uuid UUID,
  p_quote_id UUID,
  p_actor_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT private.agency_actor_has_permission(p_workspace_uuid,p_actor_id,'trips_plan') THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='AGENCY_PERMISSION_REQUIRED';
  END IF;
  UPDATE public.agency_quotes
  SET share_token_hash=NULL,shared_at=NULL,share_expires_at=NULL,updated_by=p_actor_id
  WHERE id=p_quote_id AND workspace_uuid=p_workspace_uuid AND share_token_hash IS NOT NULL;
  IF NOT FOUND THEN RETURN false;END IF;
  INSERT INTO public.agency_audit_log(workspace_uuid,actor_user_id,action,target_type,target_id)
  VALUES(p_workspace_uuid,p_actor_id,'quote.share_revoke','quote',p_quote_id::TEXT);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_agency_quote_share(UUID,UUID,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_agency_quote_share(UUID,UUID,UUID) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
