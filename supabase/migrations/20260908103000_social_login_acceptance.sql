BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('auth.oauth-google','Account','Google-aanmelding voor nieuw en bestaand account controleren','Verify Google sign-in for a new and existing account',135),
('auth.oauth-facebook','Account','Facebook-aanmelding, e-mailtoestemming en live appstatus controleren','Verify Facebook sign-in, email permission and live app status',136),
('auth.oauth-discord','Account','Discord-aanmelding en terugkeer naar GlobeTrotr controleren','Verify Discord sign-in and return to GlobeTrotr',137),
('auth.oauth-redirect','Account','Veilige OAuth-callback en terugkeer naar een uitnodiging controleren','Verify secure OAuth callback and return to an invitation',138),
('auth.oauth-identity-linking','Account','Bestaand e-mailadres en gekoppelde identiteiten zonder dubbel profiel controleren','Verify existing email and linked identities without a duplicate profile',139)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();

COMMIT;
