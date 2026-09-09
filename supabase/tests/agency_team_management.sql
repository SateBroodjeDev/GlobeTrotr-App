-- Uitvoeren na 20260908031000_agency_team_management.sql.
-- Controleert accepteren, rollen, blokkeren, herstellen, verwijderen en weigeren.
-- Alle testdata wordt teruggedraaid.
BEGIN;

CREATE TEMP TABLE agency_team_test_ids AS SELECT
  gen_random_uuid() owner_id, gen_random_uuid() member_id, gen_random_uuid() second_member_id,
  gen_random_uuid() workspace_id, gen_random_uuid() invitation_id, gen_random_uuid() declined_id;

INSERT INTO auth.users(id, email, email_confirmed_at)
SELECT owner_id, 'agency-owner@example.invalid', now() FROM agency_team_test_ids UNION ALL
SELECT member_id, 'agency-member@example.invalid', now() FROM agency_team_test_ids UNION ALL
SELECT second_member_id, 'agency-decline@example.invalid', now() FROM agency_team_test_ids;
INSERT INTO public.workspaces(user_id, workspace_uuid, plan, data)
SELECT owner_id, workspace_id, 'agency', '{"branding":{"brandName":"Test Agency"}}'::JSONB FROM agency_team_test_ids;
INSERT INTO public.workspace_invitations(id, workspace_uuid, email, role, token_hash, invited_by, expires_at)
SELECT invitation_id, workspace_id, 'agency-member@example.invalid', 'advisor', repeat('a',64), owner_id, now()+interval '7 days' FROM agency_team_test_ids UNION ALL
SELECT declined_id, workspace_id, 'agency-decline@example.invalid', 'finance', repeat('b',64), owner_id, now()+interval '7 days' FROM agency_team_test_ids;

DO $$ DECLARE ids agency_team_test_ids%ROWTYPE; result JSONB; BEGIN
  SELECT * INTO ids FROM agency_team_test_ids;
  result := public.respond_workspace_invitation(repeat('a',64), ids.member_id, 'accept');
  IF result->>'status' <> 'accepted' OR NOT EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_uuid=ids.workspace_id AND user_id=ids.member_id AND role='advisor' AND status='active'
  ) THEN RAISE EXCEPTION 'Agency-uitnodiging werd niet correct geaccepteerd'; END IF;

  result := public.manage_workspace_member(ids.member_id, ids.owner_id, 'role', 'finance');
  IF NOT (result->>'ok')::BOOLEAN OR NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=ids.member_id AND role='finance') THEN RAISE EXCEPTION 'Rolwijziging mislukt'; END IF;
  PERFORM public.manage_workspace_member(ids.member_id, ids.owner_id, 'suspend', NULL);
  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=ids.member_id AND status='active') THEN RAISE EXCEPTION 'Blokkering mislukt'; END IF;
  PERFORM public.manage_workspace_member(ids.member_id, ids.owner_id, 'restore', NULL);
  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=ids.member_id AND status='active') THEN RAISE EXCEPTION 'Herstel mislukt'; END IF;

  result := public.respond_workspace_invitation(repeat('b',64), ids.second_member_id, 'decline');
  IF result->>'status' <> 'declined' OR EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=ids.second_member_id) THEN RAISE EXCEPTION 'Weigeren mislukt'; END IF;
  PERFORM public.manage_workspace_member(ids.member_id, ids.owner_id, 'remove', NULL);
  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=ids.member_id) THEN RAISE EXCEPTION 'Verwijderen mislukt'; END IF;
END $$;

ROLLBACK;
