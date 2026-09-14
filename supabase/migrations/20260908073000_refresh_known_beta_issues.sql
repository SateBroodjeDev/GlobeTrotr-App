-- Houd de openbare lijst met beta-beperkingen actueel en verwijder verouderde meldingen.
-- Uitvoeren na 20260908072000_update_release_checklist.sql.
BEGIN;

-- Intrekken en vernieuwen van reisuitnodigingen is inmiddels beschikbaar.
UPDATE public.known_issues
SET status = 'resolved', public = false, archived_at = COALESCE(archived_at, now()), updated_at = now()
WHERE id = '5c854f0a-8814-4f0c-9cb6-3cdfa5fce103'::UUID
   OR (lower(title_en) LIKE '%invitation%' AND (lower(title_en) LIKE '%revoke%' OR lower(title_en) LIKE '%renew%'));

INSERT INTO public.known_issues(id,title_nl,title_en,description_nl,description_en,category,status,severity,public)
VALUES
 ('5c854f0a-8814-4f0c-9cb6-3cdfa5fce104','Abonnementen en online betalingen zijn nog niet actief','Subscriptions and online payments are not active yet','Prijzen en abonnementsbeheer zijn voorbereid, maar afrekenen, verlengen, opzeggen en terugbetalen via Paddle worden pas geactiveerd nadat webhooks en de productieomgeving volledig zijn getest.','Pricing and subscription management are prepared, but checkout, renewal, cancellation and refunds through Paddle will only be activated after webhooks and the production environment have been fully tested.','improvement','planned','medium',true),
 ('5c854f0a-8814-4f0c-9cb6-3cdfa5fce105','Eigen Agency-domeinen en e-mail wachten op productiehosting','Custom agency domains and email await production hosting','Instellingen voor een eigen domein en afzender zijn zichtbaar, maar DNS-verificatie, TLS-routing en SMTP-bezorging worden pas op de eigen productieomgeving geactiveerd.','Custom domain and sender settings are visible, but DNS verification, TLS routing and SMTP delivery will only be activated on the self-hosted production environment.','improvement','planned','low',true)
ON CONFLICT(id) DO UPDATE SET
 title_nl=EXCLUDED.title_nl,title_en=EXCLUDED.title_en,
 description_nl=EXCLUDED.description_nl,description_en=EXCLUDED.description_en,
 category=EXCLUDED.category,status=EXCLUDED.status,severity=EXCLUDED.severity,
 public=EXCLUDED.public,archived_at=NULL,updated_at=now();

COMMIT;
