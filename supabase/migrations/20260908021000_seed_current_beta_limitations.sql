-- Voeg de actuele, publiek bekende beta-beperkingen zonder duplicaten toe.
-- GitHub-koppeling gebeurt daarna via Corporate Admin, zodat de server-secret
-- uitsluitend in de applicatieserver wordt gebruikt.
BEGIN;

INSERT INTO public.known_issues (
  id, title_nl, title_en, description_nl, description_en,
  category, status, severity, public
)
SELECT
  '5c854f0a-8814-4f0c-9cb6-3cdfa5fce101'::UUID,
  'Inloggen met Apple, Google of Microsoft is nog niet beschikbaar',
  'Sign-in with Apple, Google or Microsoft is not available yet',
  'Tijdens de internationale beta kun je een account maken en inloggen met e-mail en wachtwoord. OAuth-inlogmethoden worden later aangesloten.',
  'During the international beta, you can create an account and sign in with email and password. OAuth sign-in methods will be added later.',
  'improvement', 'planned', 'low', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.known_issues
  WHERE (lower(title_en) LIKE '%apple%' AND lower(title_en) LIKE '%google%' AND lower(title_en) LIKE '%microsoft%')
     OR (lower(title_nl) LIKE '%apple%' AND lower(title_nl) LIKE '%google%' AND lower(title_nl) LIKE '%microsoft%')
);

INSERT INTO public.known_issues (
  id, title_nl, title_en, description_nl, description_en,
  category, status, severity, public
)
SELECT
  '5c854f0a-8814-4f0c-9cb6-3cdfa5fce102'::UUID,
  'Automatische app-e-mails worden nog niet verstuurd',
  'Automated app emails are not sent yet',
  'Reisuitnodigingen werken via een accountmelding en een deelbare link. Automatische uitnodigings-, herinnerings- en betaalmails wachten nog op activering en domeinverificatie van de e-mailvoorziening.',
  'Trip invitations work through an account notification and a shareable link. Automated invitation, reminder and payment emails still await activation and domain verification of the email service.',
  'improvement', 'planned', 'low', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.known_issues
  WHERE (lower(title_en) LIKE '%autom%' AND lower(title_en) LIKE '%email%')
     OR (lower(title_nl) LIKE '%autom%' AND lower(title_nl) LIKE '%mail%')
);

INSERT INTO public.known_issues (
  id, title_nl, title_en, description_nl, description_en,
  category, status, severity, public
)
SELECT
  '5c854f0a-8814-4f0c-9cb6-3cdfa5fce103'::UUID,
  'Reisuitnodigingen kunnen nog niet worden ingetrokken of vernieuwd',
  'Trip invitations cannot be revoked or renewed yet',
  'Accepteren, weigeren en verlopen zijn beveiligd. De reisbeheerder kan een openstaande uitnodiging nog niet zelf intrekken of met een nieuwe vervaldatum opnieuw aanbieden.',
  'Accepting, declining and expiry are secured. A trip manager cannot yet revoke a pending invitation or offer it again with a new expiry date.',
  'usability', 'planned', 'medium', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.known_issues
  WHERE (lower(title_en) LIKE '%invitation%' AND (lower(title_en) LIKE '%revoke%' OR lower(title_en) LIKE '%renew%'))
     OR (lower(title_nl) LIKE '%uitnodiging%' AND (lower(title_nl) LIKE '%intrek%' OR lower(title_nl) LIKE '%vernieuw%'))
);

COMMIT;
