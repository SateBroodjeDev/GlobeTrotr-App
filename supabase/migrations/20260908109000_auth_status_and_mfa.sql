BEGIN;

-- De statusgegevens zijn bewust openbaar. Een ingelogde bezoeker gebruikt de
-- rol authenticated en moet dezelfde veilige, beperkte RPC kunnen uitvoeren.
GRANT EXECUTE ON FUNCTION public.get_public_platform_status() TO authenticated;

DELETE FROM public.release_checklist_items WHERE item_key = 'auth.oauth-facebook';

UPDATE public.release_checklist_items
SET label_nl = 'Google en Discord koppelen en veilig ontkoppelen controleren',
    label_en = 'Verify linking and safely unlinking Google and Discord',
    updated_at = now()
WHERE item_key = 'auth.identity-management';

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES
 ('auth.totp-mfa','Account','TOTP instellen, bij een nieuwe login controleren en veilig verwijderen','Set up TOTP, verify it during a new sign-in and remove it safely',123),
 ('public.status-authenticated','Publiek','Platformstatus als gast en als ingelogde gebruiker controleren','Verify platform status as a guest and signed-in user',107)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
